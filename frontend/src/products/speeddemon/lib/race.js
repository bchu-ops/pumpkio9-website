// Race-level helpers: lap times, tyre stints, pace. Pure functions.

const SLOW_FACTOR = 1.07; // laps over 107% of the median: pit in, safety car, traffic

const COMPOUND_COLORS = {
  SOFT: '#e8002d',
  MEDIUM: '#ffd12e',
  HARD: '#ebebeb',
  INTERMEDIATE: '#43b02a',
  WET: '#0067ad',
};

const median = (values) => {
  if (!values.length) return null;
  const s = [...values].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Timed laps in order, flagged so charts can grey out unrepresentative ones. */
export function cleanLaps(laps) {
  const timed = (laps || [])
    .filter((l) => typeof l.lap_duration === 'number')
    .sort((x, y) => x.lap_number - y.lap_number);
  const cutoff = (median(timed.map((l) => l.lap_duration)) ?? Infinity) * SLOW_FACTOR;
  return timed.map((l) => ({
    lap: l.lap_number,
    time: l.lap_duration,
    raw: l,
    start: l.lap_number === 1,
    pitOut: Boolean(l.is_pit_out_lap),
    slow: l.lap_duration > cutoff,
  }));
}

const representative = (l) => !l.start && !l.pitOut && !l.slow;

/** Best and median time over representative laps. */
export function paceSummary(clean) {
  const reps = clean.filter(representative);
  if (!reps.length) return { best: null, median: null, count: 0 };
  const best = reps.reduce((b, l) => (l.time < b.time ? l : b));
  return { best, median: median(reps.map((l) => l.time)), count: reps.length };
}

export function stintFor(stints, lap) {
  return (stints || []).find((s) => lap >= s.lap_start && lap <= (s.lap_end ?? Infinity)) || null;
}

export function compoundColor(compound) {
  return COMPOUND_COLORS[String(compound || '').toUpperCase()] || '#9b9b9b';
}

export { representative as isRepresentativeLap };
