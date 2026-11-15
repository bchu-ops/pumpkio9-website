/**
 * Nonlinear reactor models in absolute units (time in minutes). Same shape as processes.js:
 * { initial, deriv(x, u, t), output(x) }, so the PID loop and RK4 simulator are reused.
 */

/* ---------- pH neutralization: HCl titrated with NaOH in a constant-volume CSTR ----------
 * Invariant x = [Na+] − [Cl−] (mol/L) = −(excess acid c) of Faanes & Skogestad, Comput. Chem. Eng.
 * 28 (2004) 1475, App. A (https://skoge.folk.ntnu.no/publications/2004/faanes_cce_ph/ph.pdf).
 * Mixing: V·dx/dt = Fb·Cb − Fa·Ca − (Fa + Fb)·x.
 * Charge balance [H+] − Kw/[H+] + x = 0  →  [H+] = (−x + √(x² + 4Kw))/2, Kw = 1e−14 (25 °C).
 */
export const KW = 1e-14;

/**
 * [H+] root of h² + x·h − Kw = 0, written to avoid cancellation: for basic solutions (x > 0)
 * −x + √(x² + 4Kw) subtracts two nearly equal numbers, so use the equivalent 2Kw/(x + √(x² + 4Kw)).
 */
export function hydrogenIon(x) {
  const root = Math.sqrt(x * x + 4 * KW);
  return x > 0 ? (2 * KW) / (x + root) : (-x + root) / 2;
}

export function phFromX(x) {
  return -Math.log10(hydrogenIon(x));
}

/** Slope dpH/dx = 1/(ln10·([H+] + [OH−])): about 5000× larger at pH 7 than at pH 3. */
export function phSensitivity(x) {
  const h = hydrogenIon(x);
  return 1 / (Math.LN10 * (h + KW / h));
}

/**
 * u = base flow Fb [L/min]. p: { V [L], Fa [L/min], Ca, Cb [mol/L], x0, disturbAt [min], CaAfter }.
 */
export const phCstr = (p) => ({
  initial: [p.x0 ?? 0],
  deriv: ([x], Fb, t = 0) => {
    const Ca = p.disturbAt !== undefined && t >= p.disturbAt ? p.CaAfter : p.Ca;
    return [(Fb * p.Cb - p.Fa * Ca - (p.Fa + Fb) * x) / p.V];
  },
  output: ([x]) => phFromX(x),
});

/** Steady-state x for a given base flow (for presets and tests). */
export const phSteadyX = ({ Fa, Ca, Cb }, Fb) => (Fb * Cb - Fa * Ca) / (Fa + Fb);

/* ---------- Exothermic CSTR, A → B, first order, cooling jacket ----------
 * Seborg, Edgar, Mellichamp & Doyle Example 2.5 parameter set, as given by J. Kantor,
 * CBE 30338 (https://jckantor.github.io/CBE30338/02.06-Exothermic-CSTR.html):
 *   dCA/dt = (q/V)(CAi − CA) − k(T)·CA
 *   dT/dt  = (q/V)(Ti − T) + (−ΔH/(ρ·Cp))·k(T)·CA + UA/(V·ρ·Cp)·(Tc − T),  k = k0·exp(−E/(R·T))
 * At Tc = 300 K there are three steady states: (0.877 mol/L, 324.5 K) stable, (0.5, 350) unstable,
 * (0.209, 369.7) unstable/oscillatory. Raising Tc past ≈ 303 K removes the low state: runaway.
 */
export const CSTR = {
  q: 100, // L/min
  V: 100, // L
  CAi: 1, // mol/L
  Ti: 350, // K
  rho: 1000, // g/L
  Cp: 0.239, // J/(g·K)
  dH: -5e4, // J/mol
  EoverR: 8750, // K
  k0: 7.2e10, // 1/min
  UA: 5e4, // J/(min·K)
};

export const rate = (T, c = CSTR) => c.k0 * Math.exp(-c.EoverR / T);

/**
 * u = coolant temperature Tc [K]. p: { CA0, T0, disturbAt [min], TiAfter [K] } (feed temperature step).
 */
export const exothermicCstr = (p, c = CSTR) => ({
  initial: [p.CA0, p.T0],
  deriv: ([CA, T], Tc, t = 0) => {
    const Ti = p.disturbAt !== undefined && t >= p.disturbAt ? p.TiAfter : c.Ti;
    const k = rate(T, c);
    const dCA = (c.q / c.V) * (c.CAi - CA) - k * CA;
    const dT = (c.q / c.V) * (Ti - T) + (-c.dH / (c.rho * c.Cp)) * k * CA + (c.UA / (c.V * c.rho * c.Cp)) * (Tc - T);
    return [dCA, dT];
  },
  output: ([, T]) => T,
});
