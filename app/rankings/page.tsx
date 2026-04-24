import type { Metadata } from 'next';
import { RankingsClient } from './RankingsClient';
import { fetchRankings } from '@/lib/rankings';

export const metadata: Metadata = {
  title: 'Rankings – Dynrinth',
  description: 'Most downloaded Minecraft mods through Dynrinth',
};

async function getRankings() {
  try {
    return await fetchRankings();
  } catch {
    return { rankings: [], total: 0 };
  }
}

export default async function RankingsPage() {
  const { rankings, total } = await getRankings();
  return <RankingsClient rankings={rankings} total={total} />;
}
