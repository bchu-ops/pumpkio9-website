/**
 * Fixed dead time as a ring buffer of round(theta/dt) samples.
 * push(u) returns the input from theta seconds ago (0 before that).
 */
export function createDelay(theta, dt) {
  const n = Math.max(0, Math.round(theta / dt));
  const buf = new Float64Array(n);
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
