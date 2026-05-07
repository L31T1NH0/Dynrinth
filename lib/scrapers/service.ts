import type {
  Filters,
  ProjectInfo,
  ResolveResult,
  SearchPage,
} from '@/lib/modrinth/types';

export const PAGE_SIZE = 20;

type ScraperSource = 'pvprp' | 'optifine';

function sourceOf(filtersOrSource: Filters | ScraperSource): ScraperSource {
  return typeof filtersOrSource === 'string' ? filtersOrSource : filtersOrSource.source as ScraperSource;
}

function scraperApi(params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  return `/api/scrapers?${qs}`;
}

export async function fetchGameVersions(source: ScraperSource): Promise<string[]> {
  const r = await fetch(scraperApi({ source, action: 'versions' }));
  if (!r.ok) throw new Error(`scraper fetchGameVersions: HTTP ${r.status}`);
  return await r.json();
}

export async function searchProjects(
  query:   string,
  filters: Filters,
  offset:  number,
  signal?: AbortSignal,
): Promise<SearchPage> {
  const r = await fetch(scraperApi({
    source:  sourceOf(filters),
    action:  'search',
    query,
    version: filters.version,
    sort:    filters.sortIndex,
    offset:  String(offset),
    limit:   String(PAGE_SIZE),
  }), { signal });
  if (!r.ok) throw new Error(`scraper searchProjects: HTTP ${r.status}`);
  return await r.json();
}

export async function resolveProjectVersion(
  projectId: string,
  filters:   Filters,
): Promise<ResolveResult> {
  try {
    const r = await fetch(scraperApi({
      source: sourceOf(filters),
      action: 'resolve',
      id:     projectId,
    }));
    if (!r.ok) {
      if (r.status === 404) return { ok: false, reason: 'not_found' };
      if (r.status === 429) return { ok: false, reason: 'rate_limited' };
      return { ok: false, reason: 'network' };
    }
    return await r.json();
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function fetchProjectInfo(projectId: string, source: ScraperSource = 'pvprp'): Promise<ProjectInfo> {
  const r = await fetch(scraperApi({ source, action: 'info', id: projectId }));
  if (!r.ok) throw new Error(`scraper fetchProjectInfo: HTTP ${r.status}`);
  return await r.json();
}
