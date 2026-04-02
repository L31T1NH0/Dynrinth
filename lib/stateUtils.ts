import * as LZString from 'lz-string';
import type { Source } from '@/lib/modrinth/types';

// ─── Data model ───────────────────────────────────────────────────────────────

export interface ModListState {
  formatVersion: 1;
  version:       string;   // MC version e.g. "1.20.1"
  loader:        string;   // "fabric" | "forge"
  source:        Source;   // "modrinth" | "curseforge"
  mods:          string[]; // project IDs — non-dependency entries only
}

const CURRENT_FORMAT_VERSION = 1;

/**
 * Conservative limit for the encoded ?data= payload.
 * Keeps the full URL within ~8 KB, which is safe across all major browsers.
 */
const MAX_ENCODED_URL_LENGTH = 8000;

// ─── Validation & migration ───────────────────────────────────────────────────

/**
 * Validates and migrates any supported format version to the current schema.
 * Returns null for unrecognised or structurally invalid payloads so callers
 * can treat all failures uniformly without catching multiple error types.
 */
function migrate(raw: unknown): ModListState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  if (obj.formatVersion === 1) {
    if (
      typeof obj.version === 'string' &&
      typeof obj.loader  === 'string' &&
      typeof obj.source  === 'string' &&
      (obj.source === 'modrinth' || obj.source === 'curseforge') &&
      Array.isArray(obj.mods) &&
      (obj.mods as unknown[]).every(m => typeof m === 'string')
    ) {
      return obj as unknown as ModListState;
    }
    return null;
  }

  // Unknown formatVersion — refuse rather than silently misinterpret
  return null;
}

// ─── Encode / decode ──────────────────────────────────────────────────────────

export function encodeState(state: ModListState): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
}

export function decodeState(encoded: string): ModListState | null {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(encoded);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

// ─── Share URL ────────────────────────────────────────────────────────────────

/**
 * Returns the full share URL, or null if the encoded payload exceeds the safe
 * URL length. Callers should surface a "list too large — use Export" message.
 */
export function buildShareUrl(state: ModListState): string | null {
  const encoded = encodeState(state);
  if (encoded.length > MAX_ENCODED_URL_LENGTH) return null;
  return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
}

// ─── File I/O ─────────────────────────────────────────────────────────────────

/** Triggers a browser download of the state as a formatted .json file. */
export function downloadJSON(state: ModListState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `modlist-${state.version}-${state.loader}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a File object, parses it as JSON, and validates it as a ModListState.
 * Rejects with a descriptive Error on any failure so callers can surface a
 * user-facing message without inspecting error types.
 */
export function readJSONFile(file: File): Promise<ModListState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed  = JSON.parse(e.target?.result as string);
        const migrated = migrate(parsed);
        if (!migrated) { reject(new Error('Invalid or unsupported format')); return; }
        resolve(migrated);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/** Constructs a ModListState from the current UI context. */
export function buildExportState(
  version: string,
  loader:  string,
  source:  Source,
  modIds:  string[],
): ModListState {
  return { formatVersion: CURRENT_FORMAT_VERSION, version, loader, source, mods: modIds };
}
