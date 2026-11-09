import { groupByDay, onRepeat, relativeTime } from './format';

const NOW = new Date(2026, 10, 9, 12, 0, 0);
const ago = (ms) => new Date(NOW - ms).toISOString();
const play = (id, ms) => ({ played_at: ago(ms), track: { id } });

test('relativeTime', () => {
  expect(relativeTime(ago(10_000), NOW)).toBe('just now');
  expect(relativeTime(ago(12 * 60_000), NOW)).toBe('12 min ago');
  expect(relativeTime(ago(3 * 3_600_000), NOW)).toBe('3 hr ago');
  expect(relativeTime(ago(26 * 3_600_000), NOW)).toBe('1 day ago');
});

test('groupByDay keeps newest-first order', () => {
  const groups = groupByDay([play('a', 60_000), play('b', 2 * 3_600_000), play('c', 24 * 3_600_000)], NOW);
  expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday']);
  expect(groups[0].plays.map((p) => p.track.id)).toEqual(['a', 'b']);
});

test('onRepeat finds tracks played 3+ times', () => {
  const plays = ['x', 'y', 'x', 'x', 'y', 'z', 'y', 'y'].map((id, i) => play(id, i * 60_000));
  expect(onRepeat(plays).map((r) => [r.track.id, r.count])).toEqual([['y', 4], ['x', 3]]);
});
