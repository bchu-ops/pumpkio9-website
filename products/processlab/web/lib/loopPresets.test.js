import { PRESETS } from './loopPresets';
import { createPid } from './pid';
import { firstOrder, integrating, secondOrder } from './processes';
import { simulateLoop } from './simulate';
import { stepMetrics } from './metrics';

// Mirrors LoopLab's model mapping and run settings.
const make = (p) => ({
  first: () => firstOrder({ K: p.K, tau: p.tau }),
  second: () => secondOrder({ K: p.K, wn: 1 / p.tau, zeta: p.zeta }),
  integrating: () => integrating({ K: p.K / p.tau }),
}[p.model]());

const run = (id) => {
  const p = PRESETS.find((x) => x.id === id).params;
  const r = simulateLoop({
    process: make(p),
    pid: createPid({ Kc: p.Kc, tauI: p.useI ? p.tauI : Infinity, tauD: p.tauD, uMin: 0, uMax: p.uMax, antiWindup: p.antiWindup }),
    sp: 1, dt: p.tEnd / 3000, tEnd: p.tEnd, deadTime: p.deadTime,
  });
  return { r, m: stepMetrics({ t: r.t, pv: r.pv, sp: 1 }) };
};

test('pH paper as fitted (FOPDT + PD): stalls near half the step, as the note says', () => {
  const { r } = run('phpaper');
  expect(r.pv.at(-1)).toBeGreaterThan(0.4);
  expect(r.pv.at(-1)).toBeLessThan(0.5);
});

test('pH paper as an integrator: PD reaches setpoint, rise ≈ 12 s, settling ≈ 26 s, no overshoot', () => {
  const { r, m } = run('phpaperint');
  expect(r.pv.at(-1)).toBeCloseTo(1, 2);
  expect(m.overshoot).toBeLessThan(0.01);
  expect(m.riseTime).toBeGreaterThan(10);
  expect(m.riseTime).toBeLessThan(14);
  expect(m.settlingTime).toBeGreaterThan(22);
  expect(m.settlingTime).toBeLessThan(30);
});
