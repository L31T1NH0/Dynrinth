import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { validateCode, codeKey } from '@/lib/codes';
import { kvGet } from '@/lib/kvClient';
import { migrate } from '@/lib/stateSchema';
import CopyButton from './CopyButton';
import { Wordmark } from '@/components/Wordmark';
import { CubeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ModrinthProject {
  id:          string;
  slug:        string;
  title:       string;
  description: string;
  icon_url:    string | null;
  downloads:   number;
}

function fmtDownloads(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K';
  return String(n);
}

async function fetchProjects(ids: string[]): Promise<ModrinthProject[]> {
  if (ids.length === 0) return [];
  try {
    const res = await fetch(
      `https://api.modrinth.com/v2/projects?ids=${encodeURIComponent(JSON.stringify(ids))}`,
      {
        headers: { 'User-Agent': 'dynrinth/1.0 (dynrinth.vercel.app)' },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as ModrinthProject[]) : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> },
): Promise<Metadata> {
  const { code: raw } = await params;
  const code = validateCode(raw);
  if (!code) return {};
  const stored = await kvGet(codeKey(code));
  if (!stored) return {};
  const state = migrate(JSON.parse(stored));
  if (!state) return {};
  return {
    title: `Modpack ${code} — Dynrinth`,
    description: `${state.mods.length} mods for MC ${state.version} (${state.loader ?? 'fabric'})`,
  };
}

export default async function PackPage(
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await params;
  const code = validateCode(raw);
  if (!code) notFound();

  const stored = await kvGet(codeKey(code!));
  if (!stored) notFound();

  const state = migrate(JSON.parse(stored!));
  if (!state) notFound();

  const projects = await fetchProjects(state!.mods);
  const byId     = new Map(projects.map(p => [p.id, p]));
  const command  = `/dynrinth ${code}`;
  const loader   = state.loader ?? 'fabric';

  return (
    <main className="min-h-dvh bg-bg-base text-ink-primary font-sans flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-3.5 border-b border-line-subtle bg-bg-base shrink-0 h-12">
        <div className="flex items-center gap-3">
          <a href="/" title="Back to Dynrinth" className="shrink-0">
            <Wordmark />
          </a>

          <span className="text-line-strong hidden sm:block">·</span>

          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <code className="text-ink-primary font-mono text-[13px] font-semibold">{code}</code>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-ink-secondary border border-line-subtle font-mono">
              MC {state.version}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-ink-secondary border border-line-subtle">
              {loader}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-glow text-brand border border-brand/30 font-mono">
              {state.mods.length} mod{state.mods.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <CopyButton command={command} />
      </header>

      {/* ── Mod list ── */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-0 sm:px-4 sm:py-2">
        {state.mods.map(id => {
          const p = byId.get(id);
          return (
            <div key={id} className="flex items-start gap-3 px-4 py-3.5 border-b border-line hover:bg-bg-surface/60 transition-colors duration-100">

              {/* Icon */}
              {p?.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.icon_url}
                  alt={p.title}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg border border-line-subtle object-cover shrink-0 bg-bg-surface mt-0.5"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-bg-surface border border-line-subtle flex items-center justify-center shrink-0 mt-0.5">
                  <CubeIcon className="w-5 h-5 text-ink-tertiary" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                {p ? (
                  <>
                    <a
                      href={`https://modrinth.com/project/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold leading-tight hover:underline hover:text-brand transition-colors"
                    >
                      {p.title}
                    </a>
                    <p className="text-xs text-ink-secondary mt-0.5 leading-snug line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-glow text-brand border border-brand/30 font-mono">
                        ⬇ {fmtDownloads(p.downloads)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-ink-tertiary text-[13px] font-mono">{id}</span>
                )}
              </div>

              {/* External link */}
              {p && (
                <a
                  href={`https://modrinth.com/project/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-bg-card text-ink-secondary flex items-center justify-center shrink-0 self-center hover:text-brand hover:bg-brand-glow transition-all duration-150"
                  title={`Open ${p.title} on Modrinth`}
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
