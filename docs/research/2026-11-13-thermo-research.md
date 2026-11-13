# Research: Thermodynamics for the controls lab (2026-11-13)

Companion to `docs/products/2026-11-09-controls-cfd-handoff.md`. Goal: replace black-box transfer functions with physics-based process models where it adds teaching value.

## Questions
1. Which thermodynamic models fit the site (browser-only) and Brian's lab work?
2. Exact equations, units, demo parameters, sources.

## Findings

### Vapor pressure: Antoine (verified)
NIST Webbook, water: https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4
log10(P/bar) = A − B/(T/K + C)

| T range (K) | A | B | C | Source |
|---|---|---|---|---|
| 255.9–373 | 4.6543 | 1435.264 | −64.848 | Stull 1947 (one set for the demo) |
| 273–303 | 5.40221 | 1838.675 | −31.737 | Bridgeman & Aldrich 1964 |
| 304–333 | 5.20389 | 1733.926 | −39.485 | Bridgeman & Aldrich 1964 |
| 334–363 | 5.0768 | 1659.793 | −45.854 | Bridgeman & Aldrich 1964 |
| 344–373 | 5.08354 | 1663.125 | −45.622 | Bridgeman & Aldrich 1964 |

Critical pressure of water Pc = 220.64 bar (same page). The 379–573 K set on that page cites a D2O paper; do not use it for water.
Use: Pv for the valve tool's choked-flow / cavitation check (FF = 0.96 − 0.28·√(Pv/Pc), formula still unverified).

### Water ionization Kw (verified)
https://en.wikipedia.org/wiki/Self-ionization_of_water
pKw: 0 °C 14.95 · 25 °C 13.99 · 50 °C 13.26 · 75 °C 12.70 · 100 °C 12.25. Interpolate the table for the demo.

### Heat exchanger: effectiveness–NTU (verified)
https://en.wikipedia.org/wiki/NTU_method
- C = ṁ·cp; Cr = Cmin/Cmax; NTU = UA/Cmin; Q = ε·Cmin·(Th,in − Tc,in).
- Counterflow: ε = (1 − exp[−NTU(1−Cr)]) / (1 − Cr·exp[−NTU(1−Cr)]); for Cr = 1, ε = NTU/(1+NTU).
- Parallel: ε = (1 − exp[−NTU(1+Cr)]) / (1+Cr).
- Lumped dynamic model (unverified): Mh·cp·dTh/dt = Ch(Th,in − Th) − UA(Th − Tc), mirrored for the cold side.
- Ties to Brian's plate heat exchanger lab: Nusselt correlation C1 = 1.7868, C2 = 0.6853 gives h, and so UA.

### pH neutralization (partly verified)
- Model structure, Hensen & Seborg 1994 (IEEE TCST 2(3)): reaction invariants Wa, Wb as states; pH found from a charge balance; tank 2.105 L; base flow 10–20 mL/s. Source seen via https://github.com/Makks7/pH-PINN (secondary).
- Strong acid/base (unverified, standard form): [H+] − Kw/[H+] + Wa = 0 → [H+] = (−Wa + √(Wa² + 4Kw))/2, pH = −log10[H+].
- Gain d(pH)/dWa = −1/(ln10·√(Wa² + 4Kw)). It peaks at pH 7 and drops by orders of magnitude a few pH units away. That is why a fixed-gain PID struggles, and why Brian's FOPDT fit only holds near one operating point.

### Exothermic CSTR (partly verified)
- Multiple steady states from heat generation G(T) vs removal R(T): low and high states stable, middle unstable. https://home.iitk.ac.in/~vshankar/che381/files/cstrmultiple.pdf ; https://en.wikipedia.org/wiki/Continuous_stirred-tank_reactor
- ODEs (unverified, standard A→B first order):
  - dCA/dt = (q/V)(CAf − CA) − k0·e^(−E/RT)·CA
  - ρcp·dT/dt = ρcp(q/V)(Tf − T) + (−ΔH)k0·e^(−E/RT)·CA − UA(T − Tc)/V
- Parameters: take from a textbook (Seborg / Bequette) before use.

## Implications
1. Antoine + Kw: one-line functions, verified. They unlock the valve tool's cavitation check. Do first; cheap.
2. pH CSTR physics model: the strongest "my own research" demo. It shows the nonlinear gain against Brian's FOPDT fit. Needs the strong-acid/base charge-balance equation verified, then the paper's flows and concentrations.
3. Heat exchanger: ε-NTU calculator, then the lumped dynamic model as a loop-lab process (temperature control).
4. Exothermic CSTR with a G(T)/R(T) plot and jacket PID: the biggest wow, the most work. Verify the equations and parameters from a textbook first.

## Open / unverified
- pH charge-balance equation and the Hall/Seborg or McAvoy full form, including the weak acid/buffer term.
- Exothermic CSTR ODEs and demo parameters (Seborg Ex. / Bequette).
- Lumped heat-exchanger dynamic model.
- FF formula for the valve choked-flow check.
