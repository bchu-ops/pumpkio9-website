import { createDelay } from './delay';
import { createPid } from './pid';
import { simulateLoop, simulateOpenLoop } from './simulate';
import { exothermicCstr, phCstr, phFromX, phSensitivity, phSteadyX } from './reactors';

const PH = { V: 20, Fa: 1, Ca: 0.01, Cb: 0.01 };

test('pH from the charge-balance invariant', () => {
  expect(phFromX(0)).toBeCloseTo(7, 10);
  expect(phFromX(1e-3)).toBeCloseTo(11, 4); // excess base 1 mmol/L
  expect(phFromX(-1e-3)).toBeCloseTo(3, 4); // excess acid 1 mmol/L
});

test('pH gain near neutral is ~5000× the gain at pH 3 (Faanes & Skogestad 2004)', () => {
  expect(phSensitivity(0)).toBeCloseTo(2.1715e6, -2);
  expect(phSensitivity(0) / phSensitivity(-1e-3)).toBeGreaterThan(4900);
});

test('1% excess base flow moves the steady pH from 7 to about 9.7', () => {
  const run = simulateOpenLoop({ process: phCstr({ ...PH, x0: 0 }), u: 1.01, dt: 0.01, tEnd: 150 });
  expect(run.pv.at(-1)).toBeCloseTo(phFromX(phSteadyX(PH, 1.01)), 3);
  expect(run.pv.at(-1)).toBeCloseTo(9.70, 1);
});

test('PI holds pH 7 through a 20% acid concentration step', () => {
  const pid = createPid({ Kc: 0.1, tauI: 5, uMin: 0, uMax: 3, bias: 1 });
  const run = simulateLoop({ process: phCstr({ ...PH, x0: 0, disturbAt: 10, CaAfter: 0.012 }), pid, sp: 7, dt: 0.01, tEnd: 120, u0: 1 });
  expect(run.pv.at(-1)).toBeCloseTo(7, 2);
  expect(run.u.at(-1)).toBeCloseTo(1.2, 2); // Fb·Cb = Fa·Ca → Fb = 1.2 L/min
});

test('exothermic CSTR: low steady state at Tc = 300 K is stable (Seborg Ex. 2.5 set)', () => {
  const run = simulateOpenLoop({ process: exothermicCstr({ CA0: 0.8773, T0: 324.48 }), u: 300, dt: 0.005, tEnd: 30 });
  expect(run.pv.at(-1)).toBeCloseTo(324.48, 1);
});

test('exothermic CSTR: (0.5 mol/L, 350 K) is a steady state but unstable open loop', () => {
  const p = exothermicCstr({ CA0: 0.5, T0: 350 });
  const [dCA, dT] = p.deriv([0.5, 350], 300);
  expect(Math.abs(dCA)).toBeLessThan(1e-3);
  expect(Math.abs(dT)).toBeLessThan(1e-2);
  const run = simulateOpenLoop({ process: exothermicCstr({ CA0: 0.5, T0: 350.5 }), u: 300, dt: 0.005, tEnd: 30 });
  expect(Math.max(...run.pv)).toBeGreaterThan(400); // tiny upset ignites the reactor
});

test('raising coolant to 305 K removes the low steady state: runaway', () => {
  const run = simulateOpenLoop({ process: exothermicCstr({ CA0: 0.8773, T0: 324.48 }), u: 305, dt: 0.005, tEnd: 30 });
  expect(run.pv.at(-1)).toBeGreaterThan(360);
});

test('PI on coolant temperature holds the unstable 350 K point through a +5 K feed step', () => {
  const pid = createPid({ Kc: 5, tauI: 1, uMin: 250, uMax: 350, bias: 300 });
  const run = simulateLoop({ process: exothermicCstr({ CA0: 0.5, T0: 350, disturbAt: 5, TiAfter: 355 }), pid, sp: 350, dt: 0.005, tEnd: 30, u0: 300 });
  expect(run.pv.at(-1)).toBeCloseTo(350, 2);
  expect(Math.max(...run.pv)).toBeLessThan(351);
});

test('dead-time buffer can start at the steady input', () => {
  const d = createDelay(0.3, 0.1, 300);
  expect([d.push(1), d.push(2), d.push(3), d.push(4)]).toEqual([300, 300, 300, 1]);
});

test('pH stays accurate for strongly basic and acidic solutions (no cancellation)', () => {
  expect(phFromX(0.1)).toBeCloseTo(13, 9);
  expect(phFromX(1)).toBeCloseTo(14, 9);
  expect(phFromX(-0.1)).toBeCloseTo(1, 9);
  expect(phSensitivity(0.01)).toBeGreaterThan(0);
});
