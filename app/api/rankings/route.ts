import { NextRequest, NextResponse } from 'next/server';
import { fetchRankings, type RankingsResponse } from '@/lib/rankings';

export type { RankingEntry, RankingsResponse } from '@/lib/rankings';

export async function GET(req: NextRequest): Promise<NextResponse<RankingsResponse>> {
  try {
    const limitParam = req.nextUrl.searchParams.get('limit');
    const data = await fetchRankings(limitParam);
    return NextResponse.json(
      data,
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('[rankings] KV error:', err);
    return NextResponse.json({ rankings: [], total: 0 });
  }
}
