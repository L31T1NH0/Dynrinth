const WINDOW_MS = 60_000;
const MAX_REQUESTS = 400;

type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

export interface RateLimitStore {
  checkAndConsume(key: string): Promise<RateLimitResult>;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly store = new Map<string, number[]>();
  private lastCleanup = Date.now();

  /** Sweep stale entries at most once per window to prevent unbounded growth. */
  private cleanup(now: number) {
    if (now - this.lastCleanup < WINDOW_MS) return;
    this.lastCleanup = now;
    for (const [key, timestamps] of this.store) {
      const recent = timestamps.filter(t => now - t < WINDOW_MS);
      if (recent.length === 0) this.store.delete(key);
      else this.store.set(key, recent);
    }
  }

  async checkAndConsume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    this.cleanup(now);

    const recent = (this.store.get(key) ?? []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
      return { allowed: false, retryAfter };
    }

    recent.push(now);
    this.store.set(key, recent);
    return { allowed: true };
  }
}

class RedisKvRateLimitStore implements RateLimitStore {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async request(path: string, init?: RequestInit) {
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
  }

  async checkAndConsume(key: string): Promise<RateLimitResult> {
    const windowSec = Math.ceil(WINDOW_MS / 1000);
    // SET NX EX initializes the key with TTL only if it doesn't exist yet,
    // making the TTL atomic with key creation — no separate EXPIRE needed.
    const pipelineResponse = await this.request('/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['SET', key, '0', 'EX', windowSec, 'NX'],
        ['INCR', key],
        ['PTTL', key],
      ]),
    });

    if (!pipelineResponse.ok) {
      throw new Error(`KV pipeline failed with HTTP ${pipelineResponse.status}`);
    }

    const pipelineJson: Array<{ result: unknown; error?: string }> = await pipelineResponse.json();
    const [, incrResult, ttlResult] = pipelineJson;

    if (incrResult?.error || typeof incrResult?.result !== 'number') {
      throw new Error('KV pipeline returned an invalid response.');
    }

    const hits  = incrResult.result as number;
    const ttlMs = typeof ttlResult?.result === 'number' ? ttlResult.result : WINDOW_MS;

    if (hits > MAX_REQUESTS) {
      return { allowed: false, retryAfter: Math.ceil(ttlMs / 1000) };
    }

    return { allowed: true };
  }
}

const inMemoryStore = new InMemoryRateLimitStore();

function createRateLimitStore(): RateLimitStore {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (process.env.NODE_ENV === 'production' && url && token) {
    return new RedisKvRateLimitStore(url, token);
  }

  return inMemoryStore;
}

const rateLimitStore = createRateLimitStore();

function rateLimitKey(ip: string, route: string): string {
  return `rate-limit:${route}:${ip}`;
}

export async function checkRateLimit(ip: string, route: string): Promise<RateLimitResult> {
  const key = rateLimitKey(ip, route);

  try {
    return await rateLimitStore.checkAndConsume(key);
  } catch (error) {
    console.error('Rate limit store error, falling back to in-memory store.', error);
    return inMemoryStore.checkAndConsume(key);
  }
}
