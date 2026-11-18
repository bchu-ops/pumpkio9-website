import { simulateLoop, simulateOpenLoop } from './simulate';
import { createPid } from './pid';
import { firstOrder, integrating } from './processes';

const K = 2;
const tau = 5;

test('result has parallel t, pv, u, sp arrays of steps + 1 samples', () => {
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt: 0.1, tEnd: 10 });
  expect(Object.keys(r).sort()).toEqual(['pv', 'sp', 't', 'u']);
  [r.t, r.pv, r.u, r.sp].forEach((a) => expect(a).toHaveLength(101));
});

test('time axis starts at 0 and advances by dt up to tEnd', () => {
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt: 0.25, tEnd: 5 });
  expect(r.t[0]).toBe(0);
  expect(r.t.at(-1)).toBeCloseTo(5, 12);
  expect(r.t[3]).toBeCloseTo(0.75, 12);
});

test('open loop: first-order step response matches K(1 - exp(-t/tau))', () => {
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt: 0.01, tEnd: 20 });
  [0, 500, 1000, 2000].forEach((i) => {
    expect(r.pv[i]).toBeCloseTo(K * (1 - Math.exp(-r.t[i] / tau)), 6);
  });
});

test('open loop: u is the constant input and sp is 0 throughout', () => {
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 3, dt: 0.1, tEnd: 2 });
  expect(new Set(r.u)).toEqual(new Set([3]));
  expect(new Set(r.sp)).toEqual(new Set([0]));
});

test('open loop: PV starts at the process initial output', () => {
  const r = simulateOpenLoop({ process: integrating({ K: 1 }), u: 1, dt: 0.1, tEnd: 1 });
  expect(r.pv[0]).toBe(0);
});

test('dead time holds the PV at its initial value for theta, then it responds', () => {
  const theta = 2;
  const dt = 0.01;
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt, tEnd: 10, deadTime: theta });
  const n = Math.round(theta / dt);
  // The input reaches the plant at step n; PV first moves at sample n + 1.
  expect(r.pv[n]).toBe(0);
  expect(r.pv[n + 1]).toBeGreaterThan(0);
  // Delayed response equals the undelayed one shifted by theta.
  const free = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt, tEnd: 10 });
  expect(r.pv[n + 300]).toBeCloseTo(free.pv[300], 9);
});

test('u0 pre-fills the dead-time buffer so an absolute model starts at steady state', () => {
  // integrating K=1, input already u0=0 -> stays at 0; with u0 = 1 it would ramp during dead time.
  const hold = simulateOpenLoop({ process: integrating({ K: 1 }), u: 0, dt: 0.1, tEnd: 2, deadTime: 1, u0: 1 });
  expect(hold.pv[5]).toBeCloseTo(0.5, 9); // dead time = 10 steps: steps 0..4 all see u0 = 1, 0.1 each
  expect(hold.pv.at(-1)).toBeCloseTo(1, 9); // after the dead time the input is 0, PV freezes at 1
});

test('closed loop: sp is recorded as the constant setpoint', () => {
  const r = simulateLoop({ process: firstOrder({ K, tau }), pid: createPid({ Kc: 1 }), sp: 4, dt: 0.1, tEnd: 1 });
  expect(new Set(r.sp)).toEqual(new Set([4]));
});

test('closed loop: first u sample is the controller response to the initial error', () => {
  const r = simulateLoop({ process: firstOrder({ K, tau }), pid: createPid({ Kc: 3 }), sp: 1, dt: 0.1, tEnd: 1 });
  expect(r.u[0]).toBeCloseTo(3, 9); // Kc * (sp - 0)
});

test('closed loop: P-only offset is 1/(1 + Kc*K) for a gain-K plant', () => {
  const r = simulateLoop({ process: firstOrder({ K, tau }), pid: createPid({ Kc: 4 }), sp: 1, dt: 0.01, tEnd: 60 });
  expect(1 - r.pv.at(-1)).toBeCloseTo(1 / (1 + 4 * K), 3);
});

test('closed loop with dead time still converges for a mild PI tuning', () => {
  const r = simulateLoop({
    process: firstOrder({ K: 1, tau: 5 }), pid: createPid({ Kc: 0.5, tauI: 5 }), sp: 1, dt: 0.01, tEnd: 120, deadTime: 1,
  });
  expect(r.pv.at(-1)).toBeCloseTo(1, 2);
});

test('tEnd not a multiple of dt is rounded to the nearest whole step', () => {
  const r = simulateOpenLoop({ process: firstOrder({ K, tau }), u: 1, dt: 0.3, tEnd: 1 });
  expect(r.t).toHaveLength(Math.round(1 / 0.3) + 1);
});

test('time is passed to the process so scheduled disturbances fire at the right time', () => {
  const seen = [];
  const process = {
    initial: [0],
    deriv: (x, u, t) => { seen.push(t); return [0]; },
    output: ([y]) => y,
  };
  simulateOpenLoop({ process, u: 0, dt: 1, tEnd: 2 });
  expect(seen[0]).toBe(0); // first RK4 stage at t = 0
  // The loop runs steps + 1 times (a sample at tEnd is recorded), so the last RK4 stage is at (steps + 1) * dt.
  expect(Math.max(...seen)).toBeCloseTo(3, 12);
  expect(Math.min(...seen)).toBe(0);
});
