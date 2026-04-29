import { NextRequest, NextResponse } from 'next/server';
import { kvAvailable, kvGet, kvSet } from '@/lib/kvClient';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRequestIp } from '@/lib/requestIp';
import { generateCode, codeKey, stateStorageSignature } from '@/lib/codes';
import { migrate } from '@/lib/stateSchema';
import type { ModListState } from '@/lib/stateSchema';

const MAX_CODE_ATTEMPTS = 32;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getRequestIp(req);
  const rateLimit = await checkRateLimit(ip, '/api/codes');
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const state: ModListState | null = migrate(body?.state);
  if (!state) {
    return NextResponse.json({ ok: false, error: 'invalid state' }, { status: 400 });
  }

  if (!kvAvailable()) {
    return NextResponse.json({ code: generateCode(state) });
  }

  const stateJson = JSON.stringify(state);
  const signature = stateStorageSignature(state);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const salt = attempt === 0 ? '' : String(attempt);
    const code = generateCode(state, salt);
    const key  = codeKey(code);
    const existing = await kvGet(key);

    if (!existing) {
      await kvSet(key, stateJson, 365 * 24 * 3600);
      return NextResponse.json({ code });
    }

    try {
      const existingState = migrate(JSON.parse(existing));
      if (existingState && stateStorageSignature(existingState) === signature) {
        return NextResponse.json({ code });
      }
    } catch {
      // Treat corrupt occupied slots as collisions and try the next salted code.
    }
  }

  return NextResponse.json({ ok: false, error: 'code collision' }, { status: 409 });
}
