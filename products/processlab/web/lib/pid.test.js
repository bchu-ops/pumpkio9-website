import { createPid } from './pid';
import { firstOrder } from './processes';
import { simulateLoop } from './simulate';

const plant = () => firstOrder({ K: 1, tau: 5 });

test('P-only control leaves offset 1/(1+Kc*K)', () => {
  const run = simulateLoop({ process: plant(), pid: createPid({ Kc: 4 }), sp: 1, dt: 0.01, tEnd: 40 });
  expect(1 - run.pv[run.pv.length - 1]).toBeCloseTo(1 / (1 + 4), 3);
});

test('PI control removes steady-state offset', () => {
  const run = simulateLoop({ process: plant(), pid: createPid({ Kc: 2, tauI: 5 }), sp: 1, dt: 0.01, tEnd: 60 });
  expect(run.pv[run.pv.length - 1]).toBeCloseTo(1, 3);
});

test('output is clamped to limits', () => {
  const run = simulateLoop({
    process: plant(), pid: createPid({ Kc: 50, tauI: 1, uMin: 0, uMax: 1.5 }), sp: 1, dt: 0.01, tEnd: 20,
  });
  expect(Math.max(...run.u)).toBeLessThanOrEqual(1.5);
  expect(Math.min(...run.u)).toBeGreaterThanOrEqual(0);
});

test('anti-windup (clamping) cuts overshoot when the valve saturates', () => {
  const opts = { Kc: 3, tauI: 2, uMin: 0, uMax: 1.2 };
  const run = (antiWindup) => simulateLoop({
    process: plant(), pid: createPid({ ...opts, antiWindup }), sp: 1, dt: 0.01, tEnd: 60,
  });
  const peak = (r) => Math.max(...r.pv);
  expect(peak(run(true))).toBeLessThan(peak(run(false)));
});

test('anti-windup also works for reverse-acting loops (Kc < 0)', () => {
  // Output stuck at its upper limit while Kc·e keeps pushing up: the integral must freeze.
  const pid = createPid({ Kc: -2, tauI: 1, uMin: 0, uMax: 1, antiWindup: true });
  for (let i = 0; i < 100; i += 1) pid.step({ sp: 0, pv: 5, dt: 0.1 });
  // Once the error flips, the output leaves the limit right away instead of
  // first unwinding a large integral.
  expect(pid.step({ sp: 0, pv: -0.5, dt: 0.1 })).toBeLessThan(1);
});

test('derivative acts on PV: setpoint step gives no derivative kick', () => {
  const pid = createPid({ Kc: 1, tauD: 2 });
  const u0 = pid.step({ sp: 0, pv: 0, dt: 0.01 });
  const u1 = pid.step({ sp: 1, pv: 0, dt: 0.01 });
  expect(u1 - u0).toBeCloseTo(1, 9); // only the proportional change
});
