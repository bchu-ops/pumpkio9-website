import {
  lapTime,
  fastestLap,
  lapWindow,
  buildTrace,
  resample,
  compareLaps,
  miniSectors,
  brakingZones,
  insights,
} from './telemetry';

const START = '2025-12-07T14:00:00.000000+00:00';
const at = (sec) => new Date(Date.parse(START) + sec * 1000).toISOString();

// Constant-speed lap: `kmh` for `duration` seconds, one sample every 0.25 s.
function carData(kmh, duration, { brakeFrom = Infinity } = {}) {
  const rows = [];
  for (let t = 0.1; t < duration; t += 0.25) {
    rows.push({ date: at(t), speed: kmh, throttle: t >= brakeFrom ? 0 : 100, brake: t >= brakeFrom ? 100 : 0, n_gear: 7, rpm: 11000, drs: 0 });
  }
  return rows;
}
function location(duration) {
  const rows = [];
  for (let t = 0; t <= duration; t += 0.3) rows.push({ date: at(t), x: t * 10, y: -t * 5 });
  return rows;
}

describe('lapTime', () => {
  it('formats minutes, seconds and milliseconds', () => {
    expect(lapTime(87.625)).toBe('1:27.625');
    expect(lapTime(59.9)).toBe('59.900');
    expect(lapTime(null)).toBe('—');
  });
});

describe('fastestLap', () => {
  it('ignores missing durations and pit-out laps', () => {
    const laps = [
      { lap_number: 1, lap_duration: null },
      { lap_number: 2, lap_duration: 80, is_pit_out_lap: true },
      { lap_number: 3, lap_duration: 90 },
      { lap_number: 4, lap_duration: 88.2 },
    ];
    expect(fastestLap(laps).lap_number).toBe(4);
    expect(fastestLap([])).toBeNull();
  });
});

describe('lapWindow', () => {
  it('spans the lap with a small margin on both ends', () => {
    const w = lapWindow({ date_start: START, lap_duration: 10 }, 0.5);
    expect(Date.parse(w.start)).toBe(Date.parse(START) - 500);
    expect(Date.parse(w.end)).toBe(Date.parse(START) + 10500);
  });
});

describe('buildTrace', () => {
  const trace = buildTrace(carData(180, 10), location(10), START, 10);

  it('starts at the line and ends exactly at the lap time', () => {
    expect(trace[0].t).toBe(0);
    expect(trace[0].d).toBe(0);
    expect(trace[trace.length - 1].t).toBeCloseTo(10, 6);
  });

  it('integrates speed into distance (180 km/h for 10 s = 500 m)', () => {
    expect(trace[trace.length - 1].d).toBeCloseTo(500, 0);
  });

  it('interpolates track position by time', () => {
    const mid = trace.find((p) => p.t > 4.9 && p.t < 5.2);
    expect(mid.x).toBeCloseTo(mid.t * 10, 1);
    expect(mid.y).toBeCloseTo(-mid.t * 5, 1);
  });

  it('drops samples outside the lap', () => {
    const extra = [{ date: at(-2), speed: 300, throttle: 100, brake: 0, n_gear: 8, rpm: 1, drs: 0 }, ...carData(180, 10)];
    expect(buildTrace(extra, location(10), START, 10)[0].speed).toBe(180);
  });
});

describe('resample', () => {
  it('returns n evenly spaced points by distance', () => {
    const grid = resample(buildTrace(carData(180, 10), [], START, 10), 101);
    expect(grid).toHaveLength(101);
    expect(grid[50].d).toBeCloseTo(250, 0);
    expect(grid[50].t).toBeCloseTo(5, 1);
    expect(grid[100].t).toBeCloseTo(10, 6);
  });
});

describe('compareLaps', () => {
  // Same 500 m, A at 50 m/s (10 s), B at 40 m/s (12.5 s).
  const a = buildTrace(carData(180, 10), [], START, 10);
  const b = buildTrace(carData(144, 12.5), [], START, 12.5);
  const cmp = compareLaps(a, b, 201);

  it('ends with the lap time difference', () => {
    expect(cmp.delta[200]).toBeCloseTo(2.5, 3);
  });

  it('grows the gap along the lap', () => {
    expect(cmp.delta[100]).toBeCloseTo(1.25, 1);
    expect(cmp.distance[200]).toBeCloseTo(500, 0);
  });

  it('splits the lap into mini-sectors that add up to the gap', () => {
    const sectors = miniSectors(cmp, 10);
    expect(sectors).toHaveLength(10);
    expect(sectors.every((s) => s.winner === 'a')).toBe(true);
    expect(sectors.reduce((sum, s) => sum + s.gain, 0)).toBeCloseTo(2.5, 3);
  });
});

describe('compareLaps aligned by track position', () => {
  // Both cars cover the same 500 m straight (x = metres). B is truly 40 m/s,
  // but its speed sensor over-reads by 20% for the first 6 s, so summed
  // distance drifts. Position alignment should still get the true gap.
  const truthB = (t) => t * 40;
  const carB = [];
  const locB = [];
  for (let t = 0.1; t < 12.5; t += 0.25) {
    carB.push({ date: at(t), speed: t < 6 ? 172.8 : 144, throttle: 100, brake: 0, n_gear: 7, rpm: 1, drs: 0 });
  }
  for (let t = 0; t <= 12.6; t += 0.3) locB.push({ date: at(t), x: truthB(t), y: 0 });
  const locA = [];
  for (let t = 0; t <= 10.1; t += 0.3) locA.push({ date: at(t), x: t * 50, y: 0 });

  const a = buildTrace(carData(180, 10), locA, START, 10);
  const b = buildTrace(carB, locB, START, 12.5);
  const cmp = compareLaps(a, b, 201);

  it('uses track position when both laps have it', () => {
    expect(cmp.alignedBy).toBe('position');
  });

  it('gets the true mid-lap gap despite sensor drift', () => {
    // At 250 m: A took 5 s, B took 6.25 s.
    expect(cmp.delta[100]).toBeCloseTo(1.25, 1);
    expect(cmp.delta[200]).toBeCloseTo(2.5, 2);
  });
});

describe('brakingZones', () => {
  it('finds where the brake goes on', () => {
    const grid = resample(buildTrace(carData(180, 10, { brakeFrom: 6 }), [], START, 10), 201);
    const zones = brakingZones(grid);
    expect(zones).toHaveLength(1);
    expect(zones[0].d).toBeGreaterThan(290);
    expect(zones[0].d).toBeLessThan(310);
  });
});

describe('insights', () => {
  it('names who gained time and where', () => {
    const a = buildTrace(carData(180, 10), [], START, 10);
    const b = buildTrace(carData(144, 12.5), [], START, 12.5);
    const notes = insights(compareLaps(a, b, 201), { a: 'VER', b: 'NOR' });
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.join(' ')).toMatch(/VER/);
    expect(notes.join(' ')).toMatch(/top speed/i);
  });
});
