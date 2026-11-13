import { rk4Step } from './rk4';
import { createDelay } from './delay';

/** Open loop: constant input u applied at t = 0. */
export function simulateOpenLoop({ process, u, dt, tEnd, deadTime = 0 }) {
  return run({ process, dt, tEnd, deadTime, control: () => u, sp: 0 });
}

/** Closed loop: PID on the measured PV, setpoint step at t = 0. */
export function simulateLoop({ process, pid, sp, dt, tEnd, deadTime = 0 }) {
  return run({ process, dt, tEnd, deadTime, sp, control: (pv) => pid.step({ sp, pv, dt }) });
}

function run({ process, dt, tEnd, deadTime, sp, control }) {
  const steps = Math.round(tEnd / dt);
  const delay = createDelay(deadTime, dt);
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
    x = rk4Step((_t, s) => process.deriv(s, uIn), i * dt, x, dt);
  }
  return out;
}
