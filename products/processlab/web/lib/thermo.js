/**
 * Fluid properties and thermodynamics helpers. Temperatures in °C unless noted.
 * Sources (verified 2026-11-13):
 * - Water rho, cp at 25 °C, 1 bar: NIST Webbook fluid data
 *   https://webbook.nist.gov/cgi/fluid.cgi?ID=C7732185
 * - Antoine constants per fluid in fluids.js (water: Bridgeman & Aldrich 1964, 344–373 K, P in bar, T in K):
 *   https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4
 *   Each set is only valid inside its tMinK–tMaxK range. vaporPressureBar uses the set that covers
 *   T (water has extra lower-temperature sets in antoineRanges) and returns NaN outside all of them
 *   rather than silently extrapolating.
 * - pKw vs T: https://en.wikipedia.org/wiki/Self-ionization_of_water
 */

import { WATER } from './fluids';

export { WATER };

const K0 = 273.15;

/** Vapor pressure [bar] from Antoine: log10(P) = A − B/(T + C), T in K. */
export function vaporPressureBar(tC, fluid = WATER) {
  const tK = tC + K0;
  // Published ranges are rounded to whole kelvin (water's 373 K end means 373.15 K, the normal boiling point).
  const covers = (s) => tK >= s.tMinK - 0.5 && tK <= s.tMaxK + 0.5;
  // Main set first, so vapor pressure and boilingPointC (which uses the main set) invert exactly.
  const set = [fluid.antoine, ...(fluid.antoineRanges ?? [])].find(covers);
  if (!set) return NaN;
  return 10 ** (set.A - set.B / (tK + set.C));
}

/** Boiling point [°C] at pressure P [bar] (Antoine inverted). */
export function boilingPointC(pBar, fluid = WATER) {
  const { A, B, C } = fluid.antoine;
  return B / (A - Math.log10(pBar)) - C - K0;
}

const PKW_TABLE = [[0, 14.95], [25, 13.99], [50, 13.26], [75, 12.7], [100, 12.25]];

/** pKw of water at T [°C], linear interpolation of the table (0–100 °C). */
export function pKw(tC) {
  const t = Math.min(100, Math.max(0, tC));
  const i = Math.min(PKW_TABLE.length - 2, Math.floor(t / 25));
  const [t0, p0] = PKW_TABLE[i];
  const [t1, p1] = PKW_TABLE[i + 1];
  return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0);
}
