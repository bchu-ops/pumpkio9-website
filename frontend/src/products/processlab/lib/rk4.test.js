import { rk4Step } from './rk4';

test('integrates dy/dt = -y to e^-1 at t = 1 within 1e-6', () => {
  let y = [1];
  const dt = 0.01;
  for (let i = 0; i < 100; i += 1) y = rk4Step((t, s) => [-s[0]], 0, y, dt);
  expect(y[0]).toBeCloseTo(Math.exp(-1), 6);
});
