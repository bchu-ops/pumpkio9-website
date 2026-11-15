/**
 * Liquid property table at 25 °C, 1 bar (constant-property model).
 * antoine: log10(P/bar) = A − B/(T/K + C), valid tMinK–tMaxK.
 * hvap: latent heat at the normal boiling point [J/kg]. cp [J/(kg·K)], rho [kg/m³].
 * Sources (fetched 2026-11-13):
 *  W1 NIST fluid data, water 25 °C: https://webbook.nist.gov/cgi/fluid.cgi?ID=C7732185
 *  W2 NIST phase data, water (Bridgeman & Aldrich 1964): https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4
 *  W3 Water data page (ΔHvap 40.68 kJ/mol): https://en.wikipedia.org/wiki/Water_(data_page)
 *  E1 NIST ethanol phase data: https://webbook.nist.gov/cgi/cbook.cgi?ID=C64175&Units=SI&Mask=4
 *  E2 NIST ethanol condensed phase (cp 112.4 J/mol·K): https://webbook.nist.gov/cgi/cbook.cgi?ID=C64175&Units=SI&Mask=2
 *  E3 Ethanol data page (ρ 0.78522 g/cm³): https://en.wikipedia.org/wiki/Ethanol_(data_page)
 *  G1 NIST ethylene glycol phase data: https://webbook.nist.gov/cgi/cbook.cgi?ID=C107211&Units=SI&Mask=4
 *  G2 NIST ethylene glycol condensed phase (cp 149.6 J/mol·K): https://webbook.nist.gov/cgi/cbook.cgi?ID=C107211&Units=SI&Mask=2
 *  G3 Ethylene glycol infobox (ρ 1.1132 g/cm³): https://en.wikipedia.org/wiki/Ethylene_glycol
 *  G4 MEGlobal MEG properties (ΔHvap 53.2 kJ/mol at 1 atm): https://www.meglobal.biz/products/monoethylene-glycol/physicalproperties/
 */
export const FLUIDS = {
  water: {
    id: 'water', name: 'Water', rho: 997.05, cp: 4181.3, hvap: 2258e3, // W1, W1, W3 (40.68 kJ/mol ÷ 18.015 g/mol)
    antoine: { A: 5.08354, B: 1663.125, C: -45.622, tMinK: 344, tMaxK: 373 }, // W2 (Bridgeman & Aldrich 1964; gives 99.99 °C at 1 atm)
    // Lower-temperature sets from the same NIST page (Bridgeman & Aldrich 1964), for vapor pressure below 344 K.
    antoineRanges: [
      { A: 5.40221, B: 1838.675, C: -31.737, tMinK: 273, tMaxK: 303 },
      { A: 5.20389, B: 1733.926, C: -39.485, tMinK: 304, tMaxK: 333 },
      { A: 5.0768, B: 1659.793, C: -45.854, tMinK: 334, tMaxK: 363 },
    ],
  },
  ethanol: {
    id: 'ethanol', name: 'Ethanol', rho: 785.22, cp: 2440, hvap: 837e3, // E3, E2 (÷ 46.068), E1 (38.56 kJ/mol at Tb)
    antoine: { A: 5.24677, B: 1598.673, C: -46.424, tMinK: 292.77, tMaxK: 366.63 }, // E1 (Ambrose & Sprake 1970)
  },
  glycol: {
    id: 'glycol', name: 'Ethylene glycol', rho: 1113.2, cp: 2410, hvap: 857e3, // G3, G2 (÷ 62.068), G4 (53.2 kJ/mol at 1 atm ÷ 62.068)
    antoine: { A: 4.97012, B: 1914.951, C: -84.996, tMinK: 323, tMaxK: 473 }, // G1 (Jones & Tamplin 1952)
  },
};

export const WATER = FLUIDS.water;
