import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRequestIp } from '@/lib/requestIp';

export const runtime = 'nodejs';

const ALLOWED_HOSTS: Record<string, Set<string>> = {
  pvprp:    new Set(['pvprp.com', 'www.pvprp.com']),
  optifine: new Set(['optifine.net', 'www.optifine.net']),
};

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const limit = await checkRateLimit(ip, '/api/scrapers/download');
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const source = request.nextUrl.searchParams.get('source') ?? '';
  const rawUrl = request.nextUrl.searchParams.get('url') ?? '';
  const allowedHosts = ALLOWED_HOSTS[source];
  if (!allowedHosts || !rawUrl) {
    return NextResponse.json({ error: 'Invalid download request.' }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid download URL.' }, { status: 400 });
  }

  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    return NextResponse.json({ error: 'Download host is not allowed.' }, { status: 400 });
  }

  const upstream = await fetch(url, { redirect: 'follow' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream download failed (HTTP ${upstream.status}).` }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  const contentLength = upstream.headers.get('content-length');
  const disposition = upstream.headers.get('content-disposition');
  if (contentType) headers.set('Content-Type', contentType);
  if (contentLength) headers.set('Content-Length', contentLength);
  if (disposition) headers.set('Content-Disposition', disposition);
  headers.set('Cache-Control', 'no-store');

  return new NextResponse(upstream.body, { status: 200, headers });
}
