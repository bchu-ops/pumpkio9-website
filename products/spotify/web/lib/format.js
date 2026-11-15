const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso, now = new Date()) {
  const diff = now - new Date(iso);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} hr ago`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayLabel(iso, now = new Date()) {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// Plays arrive newest first; keep that order inside and across groups.
export function groupByDay(plays, now = new Date()) {
  return plays.reduce((groups, play) => {
    const label = dayLabel(play.played_at, now);
    const last = groups[groups.length - 1];
    return last && last.label === label
      ? [...groups.slice(0, -1), { label, plays: [...last.plays, play] }]
      : [...groups, { label, plays: [play] }];
  }, []);
}

// Tracks played `min` or more times in the recent list, most played first.
export function onRepeat(plays, min = 3) {
  const counts = plays.reduce((acc, { track }) => {
    const prev = acc.get(track.id);
    return new Map(acc).set(track.id, { track, count: (prev?.count || 0) + 1 });
  }, new Map());
  return [...counts.values()].filter((c) => c.count >= min).sort((a, b) => b.count - a.count);
}
