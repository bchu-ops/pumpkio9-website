/**
 * PID controller, ideal (ISA) form: u = Kc[e + (1/tauI)∫e dt + tauD de/dt].
 * - Derivative acts on PV (not error), so setpoint steps cause no derivative kick.
 * - Derivative is low-pass filtered with Tf = tauD/N (typical 3 <= N <= 10).
 * - Anti-windup by conditional integration (clamping): stop integrating while
 *   the output is saturated and the error would push it further.
 * Source: https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller
 * (verified 2026-11-09)
 *
 * @param {object} p
 * @param {number} p.Kc controller gain [u/PV]
 * @param {number} [p.tauI] integral time [s]; Infinity disables I
 * @param {number} [p.tauD] derivative time [s]; 0 disables D
 * @param {number} [p.N] derivative filter factor
 * @param {number} [p.uMin] [p.uMax] output limits (valve range)
 * @param {boolean} [p.antiWindup]
 */
export function createPid({
  Kc, tauI = Infinity, tauD = 0, N = 10, uMin = -Infinity, uMax = Infinity, antiWindup = true,
}) {
  let integral = 0;
  let deriv = 0;
  let pvPrev = null;

  return {
    step({ sp, pv, dt }) {
      const e = sp - pv;
      if (tauD > 0 && pvPrev !== null) {
        const Tf = tauD / N;
        deriv = (Tf / (Tf + dt)) * deriv - ((Kc * tauD) / (Tf + dt)) * (pv - pvPrev);
      }
      pvPrev = pv;

      const unsat = Kc * e + integral + deriv;
      const u = Math.min(uMax, Math.max(uMin, unsat));
      const windingUp = (unsat > uMax && e > 0) || (unsat < uMin && e < 0);
      if (Number.isFinite(tauI) && !(antiWindup && windingUp)) {
        integral += ((Kc * dt) / tauI) * e;
      }
      return u;
    },
  };
}
