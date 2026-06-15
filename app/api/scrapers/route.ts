import { spawn } from 'node:child_process';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRequestIp } from '@/lib/requestIp';

export const runtime = 'nodejs';

const VALID_SOURCES = new Set(['pvprp', 'optifine']);
const VALID_ACTIONS = new Set(['versions', 'search', 'resolve', 'info']);

function runScraper(args: string[]): Promise<unknown> {
  const python = process.env.SCRAPER_PYTHON ?? 'python3';
  const script = 'tools/scrapers/providers.py';

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Scraper timed out.'));
    }, 30_000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `Scraper exited with code ${code}.`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Scraper returned invalid JSON.'));
      }
    });
  });
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const limit = await checkRateLimit(ip, '/api/scrapers');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const params = request.nextUrl.searchParams;
  const source = params.get('source') ?? '';
  const action = params.get('action') ?? '';
  if (!VALID_SOURCES.has(source) || !VALID_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid scraper request.' }, { status: 400 });
  }

  const args = [source, action];
  const allowedParams = ['query', 'version', 'sort', 'offset', 'limit', 'id'] as const;
  for (const key of allowedParams) {
    const value = params.get(key);
    if (value !== null) args.push(`--${key}`, value);
  }

  try {
    const data = await runScraper(args);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraper failed.', detail: (error as Error).message },
      { status: 502 },
    );
  }
}
