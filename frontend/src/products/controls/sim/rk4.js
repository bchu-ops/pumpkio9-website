/**
 * One classical Runge–Kutta 4 step.
 * Source: https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods (verified 2026-11-09)
 * @param {(t: number, y: number[]) => number[]} f derivative
 * @param {number} t time [s]
 * @param {number[]} y state
 * @param {number} h step [s]
 * @returns {number[]} state at t + h
 */
export function rk4Step(f, t, y, h) {
  const add = (a, b, s) => a.map((v, i) => v + s * b[i]);
  const k1 = f(t, y);
  const k2 = f(t + h / 2, add(y, k1, h / 2));
  const k3 = f(t + h / 2, add(y, k2, h / 2));
  const k4 = f(t + h, add(y, k3, h));
  return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
