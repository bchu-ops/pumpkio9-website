import { rk4Step } from './rk4';
import { createDelay } from './delay';

/** Open loop: constant input u applied at t = 0. */
export function simulateOpenLoop({ process, u, dt, tEnd, deadTime = 0, u0 = 0 }) {
  return run({ process, dt, tEnd, deadTime, u0, control: () => u, sp: 0 });
}

/**
 * Closed loop: PID on the measured PV, setpoint step at t = 0.
 * u0: input already applied before t = 0 (fills the dead-time buffer; use the steady input for absolute-unit models).
 */
export function simulateLoop({ process, pid, sp, dt, tEnd, deadTime = 0, u0 = 0 }) {
  return run({ process, dt, tEnd, deadTime, u0, sp, control: (pv) => pid.step({ sp, pv, dt }) });
}

function run({ process, dt, tEnd, deadTime, u0 = 0, sp, control }) {
  const steps = Math.round(tEnd / dt);
  const delay = createDelay(deadTime, dt, u0);
  const out = { t: [], pv: [], u: [], sp: [] };
  let x = process.initial;
  for (let i = 0; i <= steps; i += 1) {
    const pv = process.output(x);
    const u = control(pv);
    out.t.push(i * dt);
    out.pv.push(pv);
    out.u.push(u);
    out.sp.push(sp);
    const uIn = delay.push(u);
    // Processes may use time t for scheduled disturbances.
    x = rk4Step((t, s) => process.deriv(s, uIn, t), i * dt, x, dt);
  }
  return out;
}
