import { firstOrder, secondOrder, integrating } from './processes';
import { simulateOpenLoop } from './simulate';

test('first order reaches 63.2% of K at t = tau', () => {
  const run = simulateOpenLoop({ process: firstOrder({ K: 2, tau: 5 }), u: 1, dt: 0.01, tEnd: 5 });
  expect(run.pv[run.pv.length - 1]).toBeCloseTo(2 * (1 - Math.exp(-1)), 3);
});

test('dead time delays the response by theta (FOPDT)', () => {
  const run = simulateOpenLoop({ process: firstOrder({ K: 1, tau: 2 }), u: 1, dt: 0.01, tEnd: 5, deadTime: 3 });
  const at = (time) => run.pv[Math.round(time / 0.01)];
  expect(at(2.9)).toBeCloseTo(0, 6);
  expect(at(5)).toBeCloseTo(1 - Math.exp(-1), 2);
});

test('second order overshoot matches exp(-pi*zeta/sqrt(1-zeta^2))', () => {
  const zeta = 0.3;
  const run = simulateOpenLoop({ process: secondOrder({ K: 1, wn: 1, zeta }), u: 1, dt: 0.005, tEnd: 30 });
  const expected = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta ** 2));
  expect(Math.max(...run.pv) - 1).toBeCloseTo(expected, 3);
});

test('integrating process ramps at slope K*u', () => {
  const run = simulateOpenLoop({ process: integrating({ K: 0.5 }), u: 2, dt: 0.01, tEnd: 4 });
  expect(run.pv[run.pv.length - 1]).toBeCloseTo(4, 6);
});
