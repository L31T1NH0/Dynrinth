import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRequestIp } from '@/lib/requestIp';

/** Allowlist of hostnames from which we will proxy CurseForge file downloads. */
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

  // Vercel function response limit is 4.5 MB — redirect large files directly.
  const MAX_PROXY_BYTES = 4 * 1024 * 1024;

  const head = await fetch(rawUrl, { method: 'HEAD' }).catch(() => null);
  const contentLength = head ? parseInt(head.headers.get('Content-Length') ?? '0', 10) : 0;
  if (contentLength > MAX_PROXY_BYTES) {
    return NextResponse.redirect(rawUrl, { status: 302 });
  }

  const upstream = await fetch(rawUrl);
  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const upstreamLength = parseInt(upstream.headers.get('Content-Length') ?? '0', 10);
  if (upstreamLength > MAX_PROXY_BYTES) {
    upstream.body?.cancel();
    return NextResponse.redirect(rawUrl, { status: 302 });
  }

  const headers = new Headers();
  const ct = upstream.headers.get('Content-Type');
  if (ct) headers.set('Content-Type', ct);
  const cl = upstream.headers.get('Content-Length');
  if (cl) headers.set('Content-Length', cl);

  return new NextResponse(upstream.body, { status: 200, headers });
}
