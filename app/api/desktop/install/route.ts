import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir, platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface InstallItem {
  id: string;
  filename: string;
  url: string;
}

const MAX_FILE_COUNT = 250;
const MAX_FILENAME_LENGTH = 180;

function minecraftModsDir(): string {
  if (platform() === 'win32') {
    return join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), '.minecraft', 'mods');
  }
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'minecraft', 'mods');
  }
  return join(homedir(), '.minecraft', 'mods');
}

function sanitizeFilename(filename: string): string | null {
  const cleaned = filename
    .replace(/[\\/]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  if (!cleaned || cleaned === '.' || cleaned === '..') return null;
  return cleaned.slice(0, MAX_FILENAME_LENGTH);
}

function toFetchUrl(rawUrl: string, requestUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl, requestUrl);
  } catch {
    return null;
  }

  if (url.origin === new URL(requestUrl).origin) {
    return url.pathname === '/api/curseforge/download' || url.pathname === '/api/scrapers/download'
      ? url.toString()
      : null;
  }

  if (url.protocol !== 'https:') return null;
  const allowedHosts = new Set([
    'cdn.modrinth.com',
    'cdn-raw.modrinth.com',
    'edge.forgecdn.net',
    'mediafilez.forgecdn.net',
    'media.forgecdn.net',
    'cdn.forgecdn.net',
  ]);
  return allowedHosts.has(url.hostname) ? url.toString() : null;
}

function validInstallItems(value: unknown): InstallItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_FILE_COUNT) return null;
  const items: InstallItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as Partial<InstallItem>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.filename !== 'string' ||
      typeof candidate.url !== 'string'
    ) {
      return null;
    }
    items.push({ id: candidate.id, filename: candidate.filename, url: candidate.url });
  }

  return items;
}

async function installItem(item: InstallItem, requestUrl: string, targetDir: string): Promise<string | null> {
  const filename = sanitizeFilename(item.filename);
  const url = toFetchUrl(item.url, requestUrl);
  if (!filename || !url) return 'invalid';

  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) return 'network';

  const targetPath = join(/*turbopackIgnore: true*/ targetDir, filename);
  const tempPath = join(
    /*turbopackIgnore: true*/ tmpdir(),
    `dynrinth-${process.pid}-${Date.now()}-${filename}`,
  );

  try {
    const data = await response.arrayBuffer();
    await writeFile(tempPath, Buffer.from(data));
    await rename(tempPath, targetPath);
    return null;
  } catch {
    await rm(tempPath, { force: true }).catch(() => {});
    return 'write';
  }
}

export async function POST(request: NextRequest) {
  if (process.env.DYNRINTH_DESKTOP !== '1') {
    return NextResponse.json({ error: 'Desktop install is unavailable.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const items = validInstallItems((body as { items?: unknown })?.items);
  if (!items) return NextResponse.json({ error: 'Invalid install items.' }, { status: 400 });

  const targetDir = minecraftModsDir();
  await mkdir(targetDir, { recursive: true });

  const failed: Array<{ id: string; reason: string }> = [];
  for (const item of items) {
    const reason = await installItem(item, request.url, targetDir);
    if (reason) failed.push({ id: item.id, reason });
  }

  return NextResponse.json({
    ok: failed.length === 0,
    directory: targetDir,
    installed: items.length - failed.length,
    failed,
  });
}
