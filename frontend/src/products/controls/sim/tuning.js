/**
 * Ziegler–Nichols closed-loop (ultimate gain) tuning, ideal PID form.
 * Ku: gain at sustained oscillation, Pu: oscillation period [s].
 * Source: https://en.wikipedia.org/wiki/Ziegler%E2%80%93Nichols_method (verified 2026-11-09)
 * Cohen–Coon and SIMC are not added until their formulas are verified.
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
