/**
 * Step-response metrics for a setpoint step from pv[0] to sp.
 * - riseTime: 10% → 90% of the span (common convention).
 * - overshoot: peak beyond sp as a fraction of the span.
 * - settlingTime: time after which |pv − sp| stays within band × span (2% default).
 * - iae = ∫|e| dt, ise = ∫e² dt (trapezoid rule).
 * Definitions: https://en.wikipedia.org/wiki/Step_response (verified 2026-11-09;
 * 10–90% and 2% band are conventions).
 */
export function stepMetrics({ t, pv, sp, band = 0.02 }) {
  const y0 = pv[0];
  const span = sp - y0;
  const frac = (y) => (y - y0) / span;
  const firstAt = (level) => {
    const i = pv.findIndex((y) => frac(y) >= level);
    return i < 0 ? null : t[i];
  };
  const t10 = firstAt(0.1);
  const t90 = firstAt(0.9);

  const peak = span >= 0 ? Math.max(...pv) : Math.min(...pv);
  const overshoot = Math.max(0, (peak - sp) / span);

  let lastOut = -1;
  pv.forEach((y, i) => { if (Math.abs(y - sp) > band * Math.abs(span)) lastOut = i; });
  const settlingTime = lastOut === pv.length - 1 ? null : t[lastOut + 1];

  let iae = 0;
  let ise = 0;
  for (let i = 1; i < t.length; i += 1) {
    const h = t[i] - t[i - 1];
    const e0 = sp - pv[i - 1];
    const e1 = sp - pv[i];
    iae += (h / 2) * (Math.abs(e0) + Math.abs(e1));
    ise += (h / 2) * (e0 * e0 + e1 * e1);
  }

  return {
    riseTime: t10 === null || t90 === null ? null : t90 - t10,
    overshoot,
    settlingTime,
    iae,
    ise,
  };
}
