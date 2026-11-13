/**
 * Process models as state-space ODEs. Each returns
 * { initial: number[], deriv(x, u): number[], output(x): number }.
 * Deviation variables: everything starts at 0. Dead time is added by the
 * simulator (see delay.js), so first order + dead time = FOPDT.
 * Source for FOPDT form tau*dy/dt = -y + K*u(t - theta):
 * https://apmonitor.com/pdc/index.php/Main/FirstOrderGraphical (verified 2026-11-09)
 */

/** K: gain [PV/u], tau: time constant [s] */
export const firstOrder = ({ K, tau }) => ({
  initial: [0],
  deriv: ([y], u) => [(K * u - y) / tau],
  output: ([y]) => y,
});

/** K: gain, wn: natural frequency [rad/s], zeta: damping ratio [-] */
export const secondOrder = ({ K, wn, zeta }) => ({
  initial: [0, 0],
  deriv: ([y, v], u) => [v, wn * wn * (K * u - y) - 2 * zeta * wn * v],
  output: ([y]) => y,
});

/** Integrating process (e.g. tank level): dy/dt = K*u. K: [PV/(u*s)] */
export const integrating = ({ K }) => ({
  initial: [0],
  deriv: (_x, u) => [K * u],
  output: ([y]) => y,
});
