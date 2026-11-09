// Corner-by-corner analysis of two aligned laps ("race engineer" notes).
// Works on the resampled grids from compareLaps: same index = same place.

const APEX_WINDOW_M = 60;    // a corner's apex is the slowest point within ±60 m
const APPROACH_M = 300;      // look this far either side for the straight's top speed
const MIN_DROP_KMH = 25;     // smaller dips are lifts, not corners
const MERGE_M = 150;         // apexes closer than this are one corner (chicanes)
const THROTTLE_FULL = 95;
const EVEN_S = 0.01;

const indicesWithin = (grid, i, metres) => {
  let lo = i;
  let hi = i;
  while (lo > 0 && grid[i].d - grid[lo - 1].d <= metres) lo--;
  while (hi < grid.length - 1 && grid[hi + 1].d - grid[i].d <= metres) hi++;
  return [lo, hi];
};

const maxSpeed = (grid, lo, hi) => {
  let m = -Infinity;
  for (let k = lo; k <= hi; k++) m = Math.max(m, grid[k].speed);
  return m;
};

/** Grid indices of corner apexes (slowest points that follow a real slowdown). */
export function findCorners(grid) {
  const apexes = [];
  for (let i = 1; i < grid.length - 1; i++) {
    const [lo, hi] = indicesWithin(grid, i, APEX_WINDOW_M);
    let isMin = true;
    for (let k = lo; k <= hi && isMin; k++) {
      if (grid[k].speed < grid[i].speed || (grid[k].speed === grid[i].speed && k < i)) isMin = false;
    }
    if (!isMin) continue;
    const [before] = indicesWithin(grid, i, APPROACH_M);
    const [, after] = indicesWithin(grid, i, APPROACH_M);
    const drop = Math.min(maxSpeed(grid, before, i), maxSpeed(grid, i, after)) - grid[i].speed;
    if (drop < MIN_DROP_KMH) continue;
    const prev = apexes[apexes.length - 1];
    if (prev !== undefined && grid[i].d - grid[prev].d < MERGE_M) {
      if (grid[i].speed < grid[prev].speed) apexes[apexes.length - 1] = i;
    } else {
      apexes.push(i);
    }
  }
  return apexes;
}

// Distance where the driver last went from no brake to braking before the apex.
function brakePoint(grid, start, apex) {
  for (let k = apex; k > start; k--) {
    if (grid[k].brake > 0 && !(grid[k - 1].brake > 0)) return grid[k].d;
  }
  return null;
}

function apexSpeed(grid, apex) {
  const [lo, hi] = indicesWithin(grid, apex, APEX_WINDOW_M);
  let m = Infinity;
  for (let k = lo; k <= hi; k++) m = Math.min(m, grid[k].speed);
  return m;
}

function throttlePoint(grid, apex, end) {
  for (let k = apex + 1; k <= end; k++) if (grid[k].throttle >= THROTTLE_FULL) return grid[k].d;
  return null;
}

/**
 * Per corner: time gained (delta change across the corner; positive = A
 * gained), braking point, apex speed and full-throttle point for both.
 */
export function cornerReport(cmp, apexes) {
  const last = cmp.a.length - 1;
  return apexes.map((apex, k) => {
    const start = k === 0 ? 0 : Math.round((apexes[k - 1] + apex) / 2);
    const end = k === apexes.length - 1 ? last : Math.round((apex + apexes[k + 1]) / 2);
    return {
      n: k + 1,
      apexIndex: apex,
      start,
      end,
      d: cmp.a[apex].d,
      gain: cmp.delta[end] - cmp.delta[start],
      brake: { a: brakePoint(cmp.a, start, apex), b: brakePoint(cmp.b, start, apex) },
      apex: { a: apexSpeed(cmp.a, apex), b: apexSpeed(cmp.b, apex) },
      throttle: { a: throttlePoint(cmp.a, apex, end), b: throttlePoint(cmp.b, apex, end) },
    };
  });
}

// Reasons the corner's winner was quicker, from their point of view.
function reasons(c, w, o) {
  const out = [];
  const later = c.brake[w] != null && c.brake[o] != null ? c.brake[w] - c.brake[o] : 0;
  if (later >= 5) out.push(`brakes ${Math.round(later)} m later`);
  const faster = c.apex[w] - c.apex[o];
  if (faster >= 2) out.push(`carries ${Math.round(faster)} km/h more at the apex`);
  const earlier = c.throttle[w] != null && c.throttle[o] != null ? c.throttle[o] - c.throttle[w] : 0;
  if (earlier >= 5) out.push(`back on throttle ${Math.round(earlier)} m earlier`);
  return out;
}

/** Plain-language corner notes plus a one-line summary. */
export function narrative(report, names) {
  const corners = report.map((c) => {
    const where = `C${c.n} (${(c.d / 1000).toFixed(1)} km)`;
    if (Math.abs(c.gain) < EVEN_S) return `${where}: even.`;
    const w = c.gain > 0 ? 'a' : 'b';
    const why = reasons(c, w, w === 'a' ? 'b' : 'a');
    const tail = why.length ? ` — ${why.join(', ')}.` : ' — small differences through the corner and exit.';
    return `${where}: ${names[w]} gains ${Math.abs(c.gain).toFixed(3)}s${tail}`;
  });

  const decided = report.filter((c) => Math.abs(c.gain) >= EVEN_S);
  const wonA = decided.filter((c) => c.gain > 0).length;
  const wonB = decided.length - wonA;
  const biggest = decided.reduce((m, c) => (!m || Math.abs(c.gain) > Math.abs(m.gain) ? c : m), null);
  const summary = report.length
    ? `${names.a} is quicker in ${wonA} of ${report.length} corners, ${names.b} in ${wonB}.`
      + (biggest ? ` Biggest swing: C${biggest.n} (${biggest.gain > 0 ? names.a : names.b}, ${Math.abs(biggest.gain).toFixed(3)}s).` : '')
    : 'No clear corners found on this lap.';
  return { summary, corners };
}
