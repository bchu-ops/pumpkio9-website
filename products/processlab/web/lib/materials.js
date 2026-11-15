/**
 * Wall and insulation materials: thermal conductivity k [W/(m·K)] near room temperature.
 * Sources (fetched 2026-11-13; representative values chosen inside the listed ranges):
 *  K1 https://en.wikipedia.org/wiki/List_of_thermal_conductivities
 *  K2 https://www.engineeringtoolbox.com/thermal-conductivity-d_429.html
 */
export const WALLS = {
  stainless: { name: 'Stainless steel', k: 16 }, // K1 16.3 at 296 K; K2 17
  carbonSteel: { name: 'Carbon steel', k: 45 }, // K1 36–54
  copper: { name: 'Copper', k: 400 }, // K1 401
  aluminium: { name: 'Aluminium', k: 237 }, // K1 237
  glass: { name: 'Borosilicate glass', k: 1.1 }, // K1 Pyrex 7740 (NBS 1966): 1.11 at 300 K
  hdpe: { name: 'HDPE plastic', k: 0.45 }, // K1 0.42–0.51
};

export const INSULATION = {
  none: { name: 'None', k: 1 },
  mineralWool: { name: 'Mineral wool', k: 0.04 }, // K1
  pu: { name: 'Polyurethane foam', k: 0.03 }, // K1
  fiberglass: { name: 'Fiberglass', k: 0.04 }, // K1 0.045
};

/**
 * Representative convective coefficients h [W/(m²·K)], picked inside the typical ranges of
 * Incropera et al., Fundamentals of Heat and Mass Transfer, Table 1.1
 * (copy: https://pages.mtu.edu/~fmorriso/cm3120/typical_values_heat_transfer_coefficient.pdf).
 * Radiation from hot surfaces (several W/(m²·K)) is not included.
 */
export const H = {
  airFree: 10, // free convection, gases: 2–25
  waterFree: 500, // free convection, liquids: 50–1000 (liquid inside a tank)
  waterForced: 3000, // forced convection, liquids: 100–20 000 (pipe and exchanger flow)
};
