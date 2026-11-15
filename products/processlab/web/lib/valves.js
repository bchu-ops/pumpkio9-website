/**
 * Control valve sizing for liquids (turbulent flow, line-size valve: Fp = 1, FR = 1).
 * Pressures in bar(a), flow in m³/h, Gf = specific gravity vs water at 15.6 °C.
 * Sources (checked 2026-11-15):
 *  F  Emerson Fisher Catalog 12, Sec. 2 "ANSI/ISA/IEC Valve Sizing" (follows ISA-75.01.01 / IEC 60534-2-1):
 *     https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/cat12_s2.pdf
 *  D  DeZURIK Cavitation Guide, quoting ISA-RP75.23-1995:
 *     https://www.dezurik.com/wp-content/uploads/2025/01/Cavitation-Guide.pdf
 *  L  LibreTexts (Woolf), Valves – Modeling Dynamics:
 *     https://eng.libretexts.org/Bookshelves/Industrial_and_Systems_Engineering/Chemical_Process_Dynamics_and_Controls_(Woolf)/03%3A_Sensors_and_Actuators/3.10%3A_Valves_-_Modeling_Dynamics
 */

export const KV_PER_CV = 0.865; // F: Kv = 0.865·Cv
export const PC_WATER = 221.1; // bar(a), critical pressure of water (F: 3206.2 psia)

/** Typical liquid pressure-recovery factor FL at full travel (IEC 60534-2-1 Table D.1). Valve-specific in practice. */
export const VALVE_STYLES = {
  globe: { name: 'Globe (contoured plug)', FL: 0.9 },
  segmentedBall: { name: 'Segmented ball', FL: 0.6 },
  butterflyEccentric: { name: 'Butterfly (eccentric seat)', FL: 0.6 },
  butterflyFluted: { name: 'Butterfly (fluted vane)', FL: 0.7 },
};

/** Liquid critical pressure ratio factor (F): FF = 0.96 − 0.28·√(Pv/Pc). */
export const ffFactor = (Pv, Pc = PC_WATER) => 0.96 - 0.28 * Math.sqrt(Pv / Pc);

/** Pressure drop at which flow chokes (F): ΔPmax = FL²·(P1 − FF·Pv). */
export const chokedDp = ({ FL, P1, Pv, Pc = PC_WATER }) => FL * FL * (P1 - ffFactor(Pv, Pc) * Pv);

/** Required Kv from q = Kv·√(ΔP/Gf) (IEC form, N1 = 1 for m³/h and bar). */
export const kvFor = ({ q, dP, Gf = 1 }) => q / Math.sqrt(dP / Gf);

/**
 * Size a valve for one operating point.
 * Returns required Kv/Cv (using the choked ΔP when flow is choked), the choking limit,
 * the ISA-RP75.23 cavitation index σ = (P1 − Pv)/(P1 − P2) and a plain status.
 */
export function sizeLiquidValve({ q, P1, P2, Pv, Gf = 1, FL, Pc = PC_WATER }) {
  const dP = P1 - P2;
  if (!(dP > 0) || !(q >= 0)) return { error: 'Outlet pressure must be below inlet pressure.' };
  if (!(Pv < P1)) return { error: 'Vapor pressure must be below the inlet pressure: at these conditions the liquid is already boiling at the inlet, so liquid sizing does not apply.' };
  const dPch = chokedDp({ FL, P1, Pv, Pc });
  if (!(dPch > 0)) return { error: 'No liquid pressure drop is possible before choking at these pressures. Raise the inlet pressure.' };
  const choked = dP >= dPch;
  const dPsizing = Math.min(dP, dPch);
  const Kv = kvFor({ q, dP: dPsizing, Gf });
  const sigma = (P1 - Pv) / dP;
  // σch ≈ 1/FL² follows from ΔPmax with FF ≈ 1 (approximation; real limits are valve-specific).
  const sigmaChoked = 1 / (FL * FL);
  let status = 'ok';
  if (P2 <= Pv) status = 'flashing';
  else if (choked) status = 'choked';
  return { dP, dPch, choked, dPsizing, Kv, Cv: Kv / KV_PER_CV, sigma, sigmaChoked, status };
}

/** Inherent characteristic f(x), x = opening 0–1 (L). Quick-opening √x is a textbook idealisation. */
export function inherent(type, x, R = 50) {
  const s = Math.min(1, Math.max(0, x));
  if (type === 'linear') return s;
  if (type === 'equal') return R ** (s - 1);
  if (type === 'quick') return Math.sqrt(s);
  throw new Error(`Unknown characteristic: ${type}`);
}

/**
 * Installed characteristic: valve in series with fixed line resistance at constant total ΔP.
 * Authority N = ΔP across the fully open valve / total ΔP. Relative flow
 * q = f / √(N + (1 − N)·f²), from ΔP0 = (1/Cv² + kL)·Gf·Q² (L). N = 1 gives q = f.
 */
export function installed(f, N) {
  if (f <= 0) return 0;
  return f / Math.sqrt(N + (1 - N) * f * f);
}
