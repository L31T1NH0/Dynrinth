import type { NextRequest } from 'next/server';

function cleanIp(value: string): string {
  return value.trim().replace(/^\[|\]$/g, '');
}

// cf-connecting-ip: set by Cloudflare, clients cannot forge it (CF strips it).
// x-real-ip: set by Vercel/nginx infrastructure to the actual client IP.
// x-forwarded-for: last entry is added by the last trusted proxy (most reliable
//   when clients can prepend arbitrary values to earlier positions).
export function getRequestIp(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cleanIp(cf);

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return cleanIp(realIp);

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    const last = parts[parts.length - 1];
    if (last) return cleanIp(last);
  }

  return 'unknown';
}
