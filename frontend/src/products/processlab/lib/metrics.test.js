import { stepMetrics } from './metrics';

const firstOrderRun = (tau, dt, tEnd) => {
  const t = []; const y = [];
  for (let i = 0; i * dt <= tEnd + 1e-12; i += 1) { t.push(i * dt); y.push(1 - Math.exp(-(i * dt) / tau)); }
  return { t, y };
};

test('first-order metrics: rise 10-90% = tau*ln 9, settle 2% = tau*ln 50, no overshoot', () => {
  const { t, y } = firstOrderRun(2, 0.001, 30);
  const m = stepMetrics({ t, pv: y, sp: 1 });
  expect(m.riseTime).toBeCloseTo(2 * Math.log(9), 2);
  expect(m.settlingTime).toBeCloseTo(2 * Math.log(50), 2);
  expect(m.overshoot).toBe(0);
});

test('IAE of first-order step error equals tau; ISE equals tau/2', () => {
  const { t, y } = firstOrderRun(2, 0.001, 40);
  const m = stepMetrics({ t, pv: y, sp: 1 });
  expect(m.iae).toBeCloseTo(2, 2);
  expect(m.ise).toBeCloseTo(1, 2);
});
