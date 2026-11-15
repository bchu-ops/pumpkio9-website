/**
 * Ziegler–Nichols closed-loop (ultimate gain) tuning, ideal PID form.
 * Ku: gain at sustained oscillation, Pu: oscillation period [s].
 * Source: https://en.wikipedia.org/wiki/Ziegler%E2%80%93Nichols_method (verified 2026-11-09)
 * FOPDT rules below (Cohen–Coon, SIMC) use G = K·e^(−θs)/(τs + 1), ideal PID form.
 */
export function zieglerNicholsUltimate({ Ku, Pu, type }) {
  switch (type) {
    case 'P':
      return { Kc: 0.5 * Ku };
    case 'PI':
      return { Kc: 0.45 * Ku, tauI: Pu / 1.2 };
    case 'PID':
      return { Kc: 0.6 * Ku, tauI: Pu / 2, tauD: Pu / 8 };
    default:
      throw new Error(`Unknown controller type: ${type}`);
  }
}

/**
 * Cohen–Coon (1953) open-loop rules for FOPDT, ideal form. Aggressive (quarter-decay target);
 * meant for processes with significant dead time. Requires theta > 0.
 * Sources (checked 2026-11-15): https://www.ni.com/docs/en-US/bundle/labview/page/lvpidmain/cohencoonforms.html
 * and https://legacy.dataforth.com/catalog/pdf/an123_Tuning_Control_Loops_for_Fast_Response.pdf
 */
export function cohenCoon({ K, tau, theta, type }) {
  if (!(theta > 0) || !(tau > 0) || !K) return null;
  const r = theta / tau;
  const base = tau / (K * theta);
  switch (type) {
    case 'PI':
      return { Kc: base * (0.9 + r / 12), tauI: (theta * (30 + 3 * r)) / (9 + 20 * r) };
    case 'PID':
      return { Kc: base * (4 / 3 + r / 4), tauI: (theta * (32 + 6 * r)) / (13 + 8 * r), tauD: (4 * theta) / (11 + 2 * r) };
    default:
      throw new Error(`Unknown controller type: ${type}`);
  }
}

/**
 * SIMC PI rule (Skogestad 2003, eqs. 23–24) for FOPDT: Kc = τ/(K(τc + θ)), τI = min(τ, 4(τc + θ)).
 * τc is the desired closed-loop time constant; τc = θ is the recommended "tight but robust" choice.
 * Source: https://skoge.folk.ntnu.no/publications/2003/tuningPID/finalpaper.pdf
 */
export function simcPI({ K, tau, theta, tauC = theta }) {
  if (!(tau > 0) || !K || !(tauC + theta > 0)) return null;
  return { Kc: tau / (K * (tauC + theta)), tauI: Math.min(tau, 4 * (tauC + theta)) };
}
