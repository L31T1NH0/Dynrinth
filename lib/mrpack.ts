import type { Loader } from '@/lib/modrinth/types';
import { CURRENT_FORMAT_VERSION, type ModListState } from '@/lib/stateSchema';

const MODRINTH_CDN_RE = /cdn\.modrinth\.com\/data\/([^/]+)\/versions\//;

interface ModrinthIndex {
  game:          string;
  formatVersion: number;
  files:         Array<{ downloads: string[] }>;
  dependencies:  Record<string, string>;
}

export function isModrinthIndex(raw: unknown): raw is ModrinthIndex {
  if (typeof raw !== 'object' || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    o['game'] === 'minecraft' &&
    Array.isArray(o['files']) &&
    typeof o['dependencies'] === 'object' && o['dependencies'] !== null
  );
}

export function fromModrinthIndex(index: ModrinthIndex): ModListState | null {
  const deps      = index.dependencies;
  const mcVersion = deps['minecraft'];
  if (!mcVersion) return null;

  const loader: Loader = ('forge' in deps || 'neoforge' in deps) ? 'forge' : 'fabric';

  const seen = new Set<string>();
  const mods: string[] = [];
  for (const file of index.files) {
    for (const url of file.downloads) {
      const m = MODRINTH_CDN_RE.exec(url);
      if (m && !seen.has(m[1])) {
        seen.add(m[1]);
        mods.push(m[1]);
      }
    }
  }

  if (mods.length === 0) return null;

  return {
    formatVersion: CURRENT_FORMAT_VERSION,
    version:       mcVersion,
    source:        'modrinth',
    contentType:   'mod',
    loader,
    mods,
  };
}
