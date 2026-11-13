import { BUILDER_PRESETS } from './thermoPresets';
import { simulateFlowsheet } from './flowsheet';

const last = (a) => a[a.length - 1];
const runOf = (p) => simulateFlowsheet({ units: p.units, loops: p.loops, env: { Tamb: 20 }, dt: 0.5, tEnd: p.tEnd });

test.each(BUILDER_PRESETS.map((p) => [p.id, p]))('preset %s runs without NaN', (_id, p) => {
  expect(runOf(p).series[p.watch].every(Number.isFinite)).toBe(true);
});

const loopCases = BUILDER_PRESETS.flatMap((p) => p.loops.map((l) => [p.id, l.pv, p, l]));
test.each(loopCases)('preset %s: loop on %s reaches setpoint within 2%%', (_id, _pv, p, l) => {
  expect(Math.abs(last(runOf(p).series[l.pv]) - l.sp)).toBeLessThan(0.02 * l.sp);
});

test('boil preset vaporizes ethanol but not water', () => {
  const p = BUILDER_PRESETS.find((x) => x.id === 'boil');
  expect(last(runOf(p).series['h1.x'])).toBeGreaterThan(0.1);
  const water = { ...p, units: p.units.map((u) => (u.type === 'source' ? { ...u, params: { ...u.params, fluid: 'water' } } : u)) };
  expect(last(runOf(water).series['h1.x'])).toBe(0);
});

test('insulation raises the pipe outlet temperature', () => {
  const p = BUILDER_PRESETS.find((x) => x.id === 'insulation');
  const ins = { ...p, units: p.units.map((u) => (u.type === 'pipe' ? { ...u, params: { ...u.params, ins: 'mineralWool', insMm: 50 } } : u)) };
  expect(last(runOf(ins).series['p1.T'])).toBeGreaterThan(last(runOf(p).series['p1.T']) + 5);
});
