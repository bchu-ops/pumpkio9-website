import { createDelay } from './delay';

// FOPDT dead time (tau*dy/dt = -y + K*u(t - theta)): the plant sees u from theta seconds ago.
test('returns the initial value for the first theta/dt pushes, then the delayed input', () => {
  const d = createDelay(0.3, 0.1);
  const out = [1, 2, 3, 4, 5, 6].map((u) => d.push(u));
  expect(out).toEqual([0, 0, 0, 1, 2, 3]);
});

test('delay equals exactly theta seconds: input at step i appears at step i + theta/dt', () => {
  const dt = 0.05;
  const theta = 0.5;
  const d = createDelay(theta, dt);
  const n = Math.round(theta / dt);
  const out = Array.from({ length: 40 }, (_, i) => d.push(i + 1));
  out.forEach((v, i) => expect(v).toBe(i < n ? 0 : i - n + 1));
});

test('zero dead time passes the input straight through', () => {
  const d = createDelay(0, 0.1, 7);
  expect([1, 2, 3].map((u) => d.push(u))).toEqual([1, 2, 3]);
});

test('negative dead time is treated as zero', () => {
  const d = createDelay(-1, 0.1);
  expect(d.push(5)).toBe(5);
});

test('theta is rounded to a whole number of dt steps', () => {
  // 0.26 / 0.1 = 2.6 -> 3 samples; 0.24 / 0.1 = 2.4 -> 2 samples
  const a = createDelay(0.26, 0.1);
  expect([1, 2, 3, 4].map((u) => a.push(u))).toEqual([0, 0, 0, 1]);
  const b = createDelay(0.24, 0.1);
  expect([1, 2, 3, 4].map((u) => b.push(u))).toEqual([0, 0, 1, 2]);
});

test('a dead time shorter than half a step rounds to zero delay', () => {
  const d = createDelay(0.04, 0.1);
  expect(d.push(9)).toBe(9);
});

test('initial fills the buffer for absolute-unit models (steady input before t = 0)', () => {
  const d = createDelay(0.2, 0.1, 300);
  expect([1, 2, 3].map((u) => d.push(u))).toEqual([300, 300, 1]);
});

test('independent instances do not share state', () => {
  const a = createDelay(0.1, 0.1);
  const b = createDelay(0.1, 0.1);
  a.push(5);
  expect(b.push(1)).toBe(0);
});
