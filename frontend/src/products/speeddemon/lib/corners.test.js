import { findCorners, cornerReport, narrative } from './corners';

// Lap of 2000 m on a 401-point grid (5 m apart) with corners at 600 m and 1400 m.
// B brakes later into corner 1 and carries more apex speed, but is slower
// out of corner 2. delta = B time - A time.
function makeGrid({ apex1 = 90, brake1 = 450, apex2 = 120, throttle2 = 1460 }) {
  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const d = i * 5;
    const dip = (c, depth, w) => depth * Math.max(0, 1 - Math.abs(d - c) / w);
    const speed = 300 - dip(600, 300 - apex1, 150) - dip(1400, 300 - apex2, 150);
    const brake = (d >= brake1 && d < 600) || (d >= 1270 && d < 1400) ? 100 : 0;
    const throttle = brake ? 0 : (d > 1400 && d < throttle2) || (d > 600 && d < 640) ? 40 : 100;
    pts.push({ d, t: i * 0.05, speed, brake, throttle, gear: 5 });
  }
  return pts;
}

const a = makeGrid({});
const b = makeGrid({ apex1: 96, brake1: 470, throttle2: 1500 });
const delta = a.map((_, i) => {
  const d = i * 5;
  if (d < 450) return 0;
  if (d < 700) return -0.1 * ((d - 450) / 250); // B gains 0.1 s through corner 1
  if (d < 1300) return -0.1;
  if (d < 1600) return -0.1 + 0.25 * ((d - 1300) / 300); // then loses 0.25 s at corner 2
  return 0.15;
});
const cmp = { a, b, delta, distance: a.map((p) => p.d), length: 2000 };

describe('findCorners', () => {
  it('finds each slow point once', () => {
    const corners = findCorners(a);
    expect(corners.map((c) => a[c].d)).toEqual([600, 1400]);
  });
  it('ignores gentle lifts', () => {
    const flat = a.map((p) => ({ ...p, speed: 300 - (p.d === 1000 ? 8 : 0) }));
    expect(findCorners(flat)).toEqual([]);
  });
});

describe('cornerReport', () => {
  const report = cornerReport(cmp, findCorners(a));

  it('numbers corners and measures time won in each', () => {
    expect(report.map((c) => c.n)).toEqual([1, 2]);
    expect(report[0].gain).toBeCloseTo(-0.1, 2); // negative = B gained
    expect(report[1].gain).toBeCloseTo(0.25, 2);
  });

  it('compares braking point, apex speed and throttle pickup', () => {
    expect(report[0].brake.b - report[0].brake.a).toBe(20);
    expect(Math.round(report[0].apex.b - report[0].apex.a)).toBe(6);
    expect(report[1].throttle.b - report[1].throttle.a).toBe(40);
  });
});

describe('narrative', () => {
  const lines = narrative(cornerReport(cmp, findCorners(a)), { a: 'VER', b: 'NOR' });

  it('explains each corner in plain words', () => {
    expect(lines.corners[0]).toMatch(/^C1 .*NOR.*0\.100s/);
    expect(lines.corners[0]).toMatch(/brakes 20 m later/);
    expect(lines.corners[0]).toMatch(/6 km\/h more at the apex/);
    expect(lines.corners[1]).toMatch(/VER.*0\.250s/);
    expect(lines.corners[1]).toMatch(/back on throttle 40 m earlier/);
  });

  it('summarises who won the corners', () => {
    expect(lines.summary).toMatch(/VER is quicker in 1 of 2 corners/);
    expect(lines.summary).toMatch(/C2/);
  });
});
