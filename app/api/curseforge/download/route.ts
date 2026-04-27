import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRequestIp } from '@/lib/requestIp';

/** Allowlist of hostnames for CurseForge file downloads. */
const ALLOWED_HOSTS = ['edge.forgecdn.net', 'mediafilez.forgecdn.net'];

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const limit = await checkRateLimit(ip, '/api/curseforge/download');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const rawUrl = new URL(request.url).searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'URL host not allowed.' }, { status: 400 });
  }

  return NextResponse.redirect(rawUrl, { status: 302 });
}
