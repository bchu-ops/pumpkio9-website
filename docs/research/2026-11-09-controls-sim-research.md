# Research: Controls / CFD / valves simulator  (2026-11-09)

Companion to `docs/products/2026-11-09-process-lab.md`.
Status: second pass. Verified 2026-11-09 (fetched): RK4, ideal PID form, derivative-on-PV + filter (Wikipedia gives 3 ≤ N ≤ 10), Ziegler–Nichols ultimate-gain table, FOPDT ODE (APMonitor), second-order overshoot (Wikipedia Step response). Still **unverified**: Cohen–Coon, SIMC, back-calculation Tt, valve sizing, LBM limits, Strouhal range.

## Questions

1. What do existing web control/CFD/valve tools do well, and where are the gaps?
2. Which solver methods and libraries fit a browser-only, phone-friendly site?
3. What equations and limits must be right (PID, LBM, valve sizing)?
4. What UX works for interactive simulators for both recruiters and students?

## Findings

### Prior art
- Control Tutorials for MATLAB (ctms.engin.umich.edu): strong teaching, no live sliders.
- APMonitor / BYU TCLab (apmonitor.com): good FOPDT/IMC tuning content; not browser-only.
- Most JS PID demos: P/I/D sliders + step plot only. Common gaps: no dead time, no actuator limits/windup, no noise, unclear PID form/units.
- Dan Schroeder LBM fluid demo, https://physics.weber.edu/schroeder/fluids/ (verified exists): D2Q9, drawable barriers, curl view. Closest model for module 2.
- PavelDoGreat/WebGL-Fluid-Simulation: beautiful stable-fluids toy; no obstacles, no meaningful Re.
- Valve references: Emerson/Fisher Control Valve Handbook (free PDF), ISA-75.01.01 / IEC 60534-2-1, Spirax Sarco Learn.

### Method choices (unverified)
- **CFD: LBM D2Q9 over stable fluids.** Real Reynolds number via ω, natural vortex shedding, testable.
  ν = (1/ω − 0.5)/3 (lattice units); keep u < 0.1 and ω < ~1.9 for stability.
  Phone grid ≈ 200×80 to 400×160 on canvas2D; test on a real device. Defer WebGL.
- **ODE: hand-rolled fixed-step RK4**, dt ≤ τ_min/5, zero-order hold on controller output. No Web Worker needed for the loop lab.
- **Plots: hand-rolled canvas** (~100 lines) or uPlot. Avoid Chart.js for real-time.
- **PID: write our own** (~60 lines). No npm lib is sim-grade.

### Equations to get right (unverified)
- PID: derivative on measurement with filter Tf = Td/N, N ≈ 3–10 (verified, Wikipedia PID). Anti-windup: clamping (simple) or back-calculation (Tt ≈ √(Ti·Td)). Bumpless manual→auto transfer. Dead time via ring buffer of round(θ/dt).
- Valve liquid sizing (IEC 60534-2-1): Q = N1·Fp·Cv·√(ΔP/Gf); N1 = 1 for gpm/psi.
  Choked: ΔPmax = FL²·(P1 − FF·Pv), FF = 0.96 − 0.28·√(Pv/Pc). Size with min(ΔP, ΔPmax). Cavitation onset is a separate check.
- Inherent characteristics: linear f = x; equal-% f = R^(x−1), R ≈ 50; quick-opening ≈ √x (approximation).
- Installed characteristic depends on valve authority N = ΔP_valve,open / ΔP_system.
- Validation targets: first-order 63.2% at t = τ; plane Poiseuille parabolic profile; cylinder Strouhal ≈ 0.16–0.2 at Re 100–200 (sensitive to blockage and cylinder resolution).

### UX patterns
- **Play first, explain after** (Nicky Case, ncase.me; Ciechanowski, ciechanow.ski). The default state already shows something interesting.
- **PhET implicit scaffolding:** constrained controls that can't break the sim, a visible Reset All.
- **Preset chips:** Step, Disturbance, Noisy sensor, Unstable, pH CSTR (paper).
- **Layout:**
  - desktop: plot left, controls right
  - mobile: sticky plot (~220 px) on top, controls below, advanced section collapsed, no bottom sheet
- **Sliders:**
  - each paired with a number input
  - labels carry symbol, name and unit
  - log scale for gains
  - native `<input type=range>` gives keyboard support
- **Accessibility:**
  - canvas has `role="img"` plus a text summary, and readouts are text
  - `aria-live` updates only on commit, never per frame
  - honor `prefers-reduced-motion`
  - visible Pause button
  - Okabe-Ito colors plus line styles
  - touch targets 44 px (WCAG 2.5.8 minimum is 24 px, verified)
- **Recruiter hook:** autoplay a preset with visible overshoot, add a one-line what/why, and link "Built from my pH control paper" and the code.
- **Performance:**
  - lazy-load the route and give the skeleton fixed dimensions
  - pause when offscreen or the tab is hidden
  - keep sim state in refs and draw straight to canvas, so React does not re-render at 60 fps

## Ideas worth borrowing

1. Schroeder's draw-a-barrier interaction and curl view.
2. A visible "Equations used" panel and a PID form/units selector (ideal, series, parallel).
3. An anti-windup on/off toggle that shows saturation.
4. A valve-authority slider that morphs the installed curve away from the inherent one.
5. A time-scale slider, with sim steps kept separate from rendering.

## Pitfalls

1. LBM blows up if ω gets close to 2 or u goes above 0.1. Clamp the sliders.
2. Valve sizing: wrong N1 unit constants, and treating choked flow and cavitation as the same check.
3. Derivative kick and noise amplification when the D term has no filter.
4. React re-rendering on every animation frame.
5. Mobile touch handling: devicePixelRatio scaling and `touch-action: none`.

## Implications for the handoff

- Order: loop lab → valves → CFD (CFD carries the most risk).
- Drop Web Workers from the loop lab.
- Add three features: anti-windup, derivative-on-PV with filter, and a PID form selector.
- Label the pH preset "FOPDT fit from paper", not a full nonlinear pH model.

## Open / unverified (must check before coding)

- Every equation and constant above. Check them against Seborg et al. (*Process Dynamics and Control*), Åström & Hägglund (*Advanced PID Control*), the Fisher Control Valve Handbook, and Krüger et al. (*The Lattice Boltzmann Method*).
- uPlot bundle size, and Cloudflare Pages limits if the site ever moves.
- WCAG 2.2.2 wording (the W3C page returned 403).
