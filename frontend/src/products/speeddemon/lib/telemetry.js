// Pure lap-analysis helpers for Speed Demon. No network, no React.
// Units: t in seconds from the lap start, d in metres, speed in km/h.

const CHANNELS = ['speed', 'throttle', 'brake', 'rpm'];
const STEP_CHANNELS = ['gear', 'drs'];
// Position matching: how far ahead (samples) to search on the reference line,
// and how much (seconds either side) to smooth the position correction.
const SEARCH_AHEAD = 40;
const SMOOTH_SEC = 1;

export function lapTime(sec) {
  if (typeof sec !== 'number' || !Number.isFinite(sec)) return '—';
  const minutes = Math.floor(sec / 60);
  const rest = (sec - minutes * 60).toFixed(3).padStart(6, '0');
  return minutes > 0 ? `${minutes}:${rest}` : (sec).toFixed(3);
}

export function fastestLap(laps) {
  const valid = (laps || []).filter((l) => typeof l.lap_duration === 'number' && !l.is_pit_out_lap);
  if (!valid.length) return null;
  return valid.reduce((best, l) => (l.lap_duration < best.lap_duration ? l : best));
}

export function lapWindow(lap, padSec = 0.5) {
  const start = Date.parse(lap.date_start);
  return {
    start: new Date(start - padSec * 1000).toISOString(),
    end: new Date(start + (lap.lap_duration + padSec) * 1000).toISOString(),
  };
}

const lerp = (a, b, f) => a + (b - a) * f;

// Value of `key` at time `t`, linearly interpolated from rows sorted by t.
function interpAt(rows, t, key) {
  if (!rows.length) return null;
  if (t <= rows[0].t) return rows[0][key];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].t >= t) {
      const f = (t - rows[i - 1].t) / (rows[i].t - rows[i - 1].t || 1);
      return lerp(rows[i - 1][key], rows[i][key], f);
    }
  }
  return rows[rows.length - 1][key];
}

/**
 * Turn raw OpenF1 car_data + location rows into one lap trace with
 * time from the line, integrated distance and interpolated track position.
 * Adds points at t=0 and t=lapDuration so the trace spans the exact lap time.
 */
export function buildTrace(carData, locationData, lapStartIso, lapDuration) {
  const t0 = Date.parse(lapStartIso);
  const toT = (date) => (Date.parse(date) - t0) / 1000;

  const samples = (carData || [])
    .map((r) => ({
      t: toT(r.date), speed: r.speed, throttle: r.throttle, brake: r.brake,
      gear: r.n_gear, rpm: r.rpm, drs: r.drs,
    }))
    .filter((s) => s.t >= 0 && s.t <= lapDuration)
    .sort((a, b) => a.t - b.t);
  if (!samples.length) return [];

  const first = samples[0];
  const last = samples[samples.length - 1];
  if (first.t > 0) samples.unshift({ ...first, t: 0 });
  if (last.t < lapDuration) samples.push({ ...last, t: lapDuration });

  const locs = (locationData || [])
    .map((r) => ({ t: toT(r.date), x: r.x, y: r.y }))
    .sort((a, b) => a.t - b.t);

  let d = 0;
  return samples.map((s, i) => {
    if (i > 0) {
      const prev = samples[i - 1];
      d += ((prev.speed + s.speed) / 2 / 3.6) * (s.t - prev.t);
    }
    return { ...s, d, x: interpAt(locs, s.t, 'x'), y: interpAt(locs, s.t, 'y') };
  });
}

/** Resample a trace onto n points evenly spaced along its distance. */
export function resample(trace, n) {
  if (!trace.length) return [];
  const total = trace[trace.length - 1].d;
  return resampleAt(trace, Array.from({ length: n }, (_, i) => (total * i) / (n - 1)));
}

/** Resample a trace (sorted by d) at the given distances. */
function resampleAt(trace, distances) {
  const out = [];
  let j = 1;
  for (const d of distances) {
    while (j < trace.length - 1 && trace[j].d < d) j++;
    const a = trace[j - 1];
    const b = trace[j];
    const f = b.d === a.d ? 0 : Math.min(1, Math.max(0, (d - a.d) / (b.d - a.d)));
    const p = { d, t: lerp(a.t, b.t, f) };
    CHANNELS.forEach((k) => { p[k] = lerp(a[k], b[k], f); });
    STEP_CHANNELS.forEach((k) => { p[k] = f < 0.5 ? a[k] : b[k]; });
    p.x = a.x == null ? null : lerp(a.x, b.x, f);
    p.y = a.y == null ? null : lerp(a.y, b.y, f);
    out.push(p);
  }
  return out;
}

const hasPosition = (trace) => trace.length > 1 && trace.every((p) => p.x != null && p.y != null);

// Distance along `ref`'s racing line of the point closest to (x, y),
// searching forward from segment `from` so the result never jumps back.
function projectOnto(ref, x, y, from) {
  let best = { dist2: Infinity, d: ref[from].d, index: from };
  const last = Math.min(ref.length - 1, from + SEARCH_AHEAD);
  for (let i = Math.max(1, from); i <= last; i++) {
    const p = ref[i - 1];
    const q = ref[i];
    const vx = q.x - p.x;
    const vy = q.y - p.y;
    const len2 = vx * vx + vy * vy || 1;
    const f = Math.min(1, Math.max(0, ((x - p.x) * vx + (y - p.y) * vy) / len2));
    const px = p.x + f * vx;
    const py = p.y + f * vy;
    const dist2 = (x - px) ** 2 + (y - py) ** 2;
    if (dist2 < best.dist2) best = { dist2, d: lerp(p.d, q.d, f), index: i - 1 };
  }
  return best;
}

// Centered moving average over samples within ±halfWindowSec.
function smoothByTime(trace, values, halfWindowSec) {
  return values.map((_, k) => {
    let sum = 0;
    let count = 0;
    for (let j = k; j >= 0 && trace[k].t - trace[j].t <= halfWindowSec; j--) { sum += values[j]; count++; }
    for (let j = k + 1; j < trace.length && trace[j].t - trace[k].t <= halfWindowSec; j++) { sum += values[j]; count++; }
    return sum / count;
  });
}

/**
 * Re-measure `trace`'s distance along `ref`'s racing line. Summed speed is
 * smooth but drifts over a lap; projected track position doesn't drift but
 * is noisy sample to sample. So keep the summed distance and correct it by
 * the (smoothed) gap between the two.
 */
function alignToReference(ref, trace) {
  const total = ref[ref.length - 1].d;
  let index = 0;
  const projected = trace.map((s, k) => {
    if (k === 0) return 0;
    if (k === trace.length - 1) return total;
    const hit = projectOnto(ref, s.x, s.y, index);
    index = hit.index;
    return hit.d;
  });
  const offsets = smoothByTime(trace, projected.map((d, k) => d - trace[k].d), SMOOTH_SEC);

  let prevD = 0;
  return trace.map((s, k) => {
    if (k === 0) return { ...s, d: 0 };
    if (k === trace.length - 1) return { ...s, d: total };
    // Keep points before the line strictly short of it, so the finish is
    // matched to B's real lap end and not to its first sample near the line.
    const ceiling = total - (trace.length - k) * 1e-3;
    prevD = Math.max(prevD, Math.min(s.d + offsets[k], ceiling));
    return { ...s, d: prevD };
  });
}

/**
 * Line two laps up and compute B's time gap to A at every point
 * (positive delta = B is behind A). With track positions on both laps,
 * B is measured along A's racing line, which avoids the drift of summing
 * speed samples. Otherwise laps are matched by fraction of lap distance.
 */
export function compareLaps(traceA, traceB, n = 600) {
  const a = resample(traceA, n);
  const byPosition = hasPosition(traceA) && hasPosition(traceB);
  let b;
  let length;
  if (byPosition) {
    length = traceA[traceA.length - 1].d;
    b = resampleAt(alignToReference(traceA, traceB), a.map((p) => p.d));
  } else {
    b = resample(traceB, n);
    length = (a[n - 1].d + b[n - 1].d) / 2;
  }
  return {
    alignedBy: byPosition ? 'position' : 'distance',
    length,
    a,
    b,
    distance: a.map((_, i) => (length * i) / (n - 1)),
    delta: a.map((p, i) => b[i].t - p.t),
  };
}

/** Split the lap into `count` equal pieces and say who was quicker in each. */
export function miniSectors(cmp, count = 24) {
  const n = cmp.a.length;
  const sectors = [];
  for (let s = 0; s < count; s++) {
    const i = Math.round((s * (n - 1)) / count);
    const j = Math.round(((s + 1) * (n - 1)) / count);
    const gain = (cmp.b[j].t - cmp.b[i].t) - (cmp.a[j].t - cmp.a[i].t);
    sectors.push({ from: i, to: j, gain, winner: gain >= 0 ? 'a' : 'b' });
  }
  return sectors;
}

/** Points where the driver goes from no brake to braking. */
export function brakingZones(grid, minGapM = 150) {
  const zones = [];
  for (let i = 1; i < grid.length; i++) {
    const on = grid[i].brake > 0 && !(grid[i - 1].brake > 0);
    if (on && (!zones.length || grid[i].d - zones[zones.length - 1].d > minGapM)) {
      let minSpeed = grid[i].speed;
      for (let k = i; k < grid.length && k < i + 60 && grid[k].throttle < 90; k++) {
        minSpeed = Math.min(minSpeed, grid[k].speed);
      }
      zones.push({ index: i, d: grid[i].d, speed: grid[i].speed, minSpeed });
    }
  }
  return zones;
}

const fmtGap = (s) => `${Math.abs(s).toFixed(3)}s`;

/** Plain-language notes on where the lap was won and lost. */
export function insights(cmp, names) {
  const notes = [];
  const total = cmp.delta[cmp.delta.length - 1];
  const leader = total >= 0 ? names.a : names.b;
  notes.push(`${leader} is ${fmtGap(total)} quicker over the lap.`);

  // Longer sectors than the map's, so one noisy braking zone doesn't dominate.
  const sectors = miniSectors(cmp, 12);
  const best = (side) => sectors.filter((s) => s.winner === side).sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain))[0];
  ['a', 'b'].forEach((side) => {
    const s = best(side);
    if (s && Math.abs(s.gain) > 0.005) {
      const from = Math.round(cmp.distance[s.from]);
      const to = Math.round(cmp.distance[s.to]);
      notes.push(`${names[side]}'s biggest gain: ${fmtGap(s.gain)} between ${from} m and ${to} m.`);
    }
  });

  const top = (grid) => Math.max(...grid.map((p) => p.speed));
  const topA = top(cmp.a);
  const topB = top(cmp.b);
  notes.push(`Top speed: ${names.a} ${Math.round(topA)} km/h vs ${names.b} ${Math.round(topB)} km/h.`);

  const zonesA = brakingZones(cmp.a);
  const zonesB = brakingZones(cmp.b);
  zonesA.forEach((za) => {
    const zb = zonesB.find((z) => Math.abs(z.d - za.d) < 120);
    if (!zb) return;
    const diff = zb.d - za.d;
    if (Math.abs(diff) >= 10) {
      const later = diff > 0 ? names.b : names.a;
      notes.push(`Braking near ${Math.round(za.d)} m: ${later} brakes ${Math.round(Math.abs(diff))} m later.`);
    }
  });
  return notes;
}
