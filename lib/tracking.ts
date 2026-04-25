interface TrackEntry {
  id:          string;
  name:        string;
  source:      string;
  iconUrl?:    string;
  contentType: string;
  version?:    string;
}

/** Fire-and-forget: records a completed download in the leaderboard. Never throws. */
export function trackDownload(entries: TrackEntry[]): void {
  if (!entries.length) return;
  fetch('/api/track-download', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ mods: entries }),
  }).catch(() => { /* tracking failure never affects downloads */ });
}
