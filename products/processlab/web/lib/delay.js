/**
 * Fixed dead time as a ring buffer of round(theta/dt) samples.
 * push(u) returns the input from theta seconds ago (0 before that).
 * theta is rounded to a whole number of dt steps.
 * initial: value returned before theta has passed (0 for deviation variables; the steady input for absolute ones).
 */
export function createDelay(theta, dt, initial = 0) {
  const n = Math.max(0, Math.round(theta / dt));
  const buf = new Float64Array(n).fill(initial);
  let idx = 0;
  return {
    push(u) {
      if (n === 0) return u;
      const out = buf[idx];
      buf[idx] = u;
      idx = (idx + 1) % n;
      return out;
    },
  };
}
