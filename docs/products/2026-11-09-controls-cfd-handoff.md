# Handoff: Controls / CFD simulator + valves learning tool

Status: building. Loop Lab + Process Builder (B1–B3) running locally 2026-11-13; see slices below.
Owner: Brian. Written 2026-11-09.

## What Brian asked for

> "a control systems simulator and/or CFD type of simulator as well with controls to be able to tweak stuff and eqn solvers with good visuals showing what happens/what we see then also various types of valves with intellectual explanations/learning tool"

It goes in the site's **Products** menu (`Navbar.js` Product 1–3 placeholders; `Product3.js` is free). It should showcase Brian's chemical engineering background (M.S. ChemE, FE Chemical) next to the software work.

## Why it fits Brian

The simulator can reuse Brian's own lab work, which makes it his rather than a generic demo:

- **pH control in a CSTR** (paper: FOPDT models, PD control optimal, Kc = 28 ± 3, τD = 4.6 ± 0.3 s, 15 s rise time). This is a ready-made first scenario with real numbers to validate against.
- **Plate heat exchanger** (Nusselt correlation C1 = 1.7868, C2 = 0.6853). Good for a heat-transfer scenario.
- **LPCVD reactor** (factorial design; silane fraction > temperature > pressure). Good for a "which knob matters" exercise.
- **Dimethylamine reactor + P&ID** (Aspen/COMSOL). Gives the P&ID and valve context.

## Hard constraints

- **Static hosting.** GitHub Pages, React CRA, so everything runs **in the browser**. No server-side solver.
- Must stay smooth on a laptop and usable on a phone (390px wide).
- Keep the site's Notion look, dark mode, accessibility 100, and no layout shift.
- Equations must be correct. Every model needs a reference (textbook or Brian's paper) and a test against a known answer.

## Proposed structure (my recommendation, not yet agreed)

Three modules behind one product page. Each works on its own, so they can ship one at a time.

### 1. Control loop lab (ship first)

- Block diagram you can click: setpoint → PID → valve → process → sensor (with dead time) → back.
- Process models: first-order, FOPDT, second-order, integrating, and **Brian's pH CSTR** preset.
- Sliders: Kc, τI, τD, dead time, noise, disturbance step, valve saturation and rate limits.
- Live plots: PV vs SP, controller output, error. Readouts: rise time, overshoot, settling time, IAE/ISE.
- Tuning helpers: Ziegler–Nichols, Cohen–Coon and IMC buttons that fill in gains and explain why.
- Solver: fixed-step RK4 in a Web Worker, with dead time held in a ring buffer. Tests compare against analytic step responses.

### 2. Flow / CFD sandbox

- Real-time 2D fluid on a canvas or WebGL: **Lattice Boltzmann (D2Q9)** or Stam's stable fluids.
- Draw obstacles; see flow past a cylinder (vortex shedding), channel flow, and a valve-like constriction.
- Sliders: inlet velocity, viscosity (Reynolds number shown live). Views: velocity magnitude, vorticity, streamlines, pressure.
- Honest label: "teaching-grade solver, not a substitute for ANSYS/COMSOL". Validate Strouhal ≈ 0.2 for a cylinder at moderate Re.

### 3. Valves learning tool

- Valve types with animated SVG cutaways: gate, globe, ball, butterfly, plug, diaphragm, check, needle, pressure-relief, and control valve with actuator and positioner.
- For each: how it works, best and worst uses, failure modes, and the P&ID symbol.
- Interactive valve characteristics: linear, equal-percentage and quick-opening curves; installed vs inherent characteristic.
- Sizing calculator: Cv/Kv from the liquid sizing equation, with flags for choked flow and cavitation.
- "Connects to module 1": pick a valve characteristic in the loop lab and watch loop gain change with valve opening.

## Tech notes for the builder

- Plain React + canvas/WebGL. Keep solvers in pure, separately tested modules (`sim/` folder), and keep UI in components. Files under 400 lines.
- Plotting: lightweight (uPlot or hand-rolled canvas) to keep the bundle small. Lazy-load the product page so the home page doesn't pay for it.
- Use Web Workers for anything that would drop frames.
- Optional later: Pyodide for Python-checked solvers, if Brian wants to show Python.

## Open questions for Brian

1. If only one module could ship first, which one: control loop lab, CFD sandbox, or valves?
2. Who is it for: recruiters skimming in 30 seconds, ChemE students learning, or both? This sets depth vs polish.
3. Should the pH CSTR preset use your paper's exact numbers and link to the paper page?
4. CFD depth: is a visual teaching sandbox enough, or do you want quantitative validation plots shown on the page?
5. Valves: is the list above right? Any you used in industry that should be featured (with real photos or P&IDs)?

## Verification plan (how we prove it works)

- Unit tests per solver:
  - first-order step reaches 63.2% at t = τ
  - PID closed loop matches the analytic response for simple cases
  - the pH preset reproduces about a 15 s rise time and under 0.1 overshoot with the paper's gains
  - LBM Poiseuille flow matches the parabolic profile
- Frame-rate check in Brian's open Chrome tab: the CFD view holds about 60 fps at default resolution on a laptop.
- Accessibility: every slider labeled with units, keyboard operable, plots have text readouts.
- Lighthouse 100 accessibility; the product page is lazy-loaded so the home page score doesn't drop.

## Out of scope for v1

- 3D CFD, turbulence models, user accounts, saving scenarios server-side.

## Decisions (2026-11-09)

- Order: control loop lab → valves → CFD (CFD is the riskiest).
- No Web Worker for the loop lab; the ODE is cheap on the main thread.
- PID: ideal (ISA) form, derivative on PV with filter (N = 10), clamping anti-windup. Formulas cited in code.
- Only formulas verified against a fetched source ship. Unverified ones wait in later slices.
- Research: `docs/research/2026-11-09-controls-sim-research.md`.

## Slices (control loop lab)

- [x] 1. Solver core `frontend/src/products/controls/sim/`: RK4, first/second-order/integrating models, dead time, PID, step metrics, Ziegler–Nichols. 13 unit tests, 99% coverage.
- [x] 2. (preview on localhost 2026-11-13) Page shell on `/Product3`: canvas plot (PV/SP/MV), sliders paired with number inputs for Kc, τI, τD, dead time; Pause/Reset; text readouts. Lazy-loaded, fixed-size skeleton.
- [ ] 3. Presets (step, disturbance, noisy sensor, unstable) + noise and disturbance inputs.
- [ ] 4. pH CSTR preset from the paper (needs the paper's fitted K, τ, θ) + link to the paper page.
- [ ] 5. Tuning helpers: Cohen–Coon and SIMC after their formulas are verified; anti-windup toggle demo.
- [ ] 6. Verify: phone 390 px, Lighthouse a11y 100, no CLS, reduced-motion.

## Thermo & Materials tab (decided 2026-11-13, replaces the card-list Process Builder)

Brian: the Loop Lab tab (basic control theory) is good as is. The second tab should focus on thermodynamics and materials, laid out as a block diagram where units and controllers go in series.

Built 2026-11-13 (`frontend/src/products/controls/builder/`, data in `sim/fluids.js` and `sim/materials.js`):
- **Block diagram (SVG):**
  - Blocks: Source → Valve / Heater / Heat exchanger / Pipe / Tank → Sink.
  - Arrows show T and vapor %.
  - PID blocks are drawn as dashed PV→PID→MV loops, several allowed.
  - Add a block after the selected one, move it left or right, or remove it.
  - The selected block's settings show in a side panel.
- **Fluids:** water, ethanol and ethylene glycol (NIST/Wikipedia: ρ, cp, Antoine, latent heat). The heater can partially vaporize a stream using enthalpy, so a stream can be two-phase.
- **Materials:** wall material, thickness and insulation set U through series resistances. Tank and pipe lose heat to ambient. Exchanger plate material sets UA.
- **Pipe:** 10 mixed cells, giving transport delay plus heat loss.
- **Stream table:** ṁ, T, vapor fraction, ρ, cp and enthalpy flow. A per-block duty, loss and vent table; the overall energy balance closes (tested).
- **Scenarios:**
  - insulation matters
  - boiling point by fluid
  - heated tank + PID
  - exchanger + pipe delay
  - level + temperature with two loops
- **Tests:** 46 controls tests, including every scenario's teaching claim.

Next:
- [ ] Material selection on the heater (element sheath) and a "compare two designs" view.
- [ ] Pressure network so pumps and valve cavitation (Antoine Pv, FL/FF formula to verify) become possible.
- [ ] pH CSTR and exothermic CSTR blocks (equations still to verify).
- [ ] Temperature-dependent properties (cp(T), ρ(T)).

## Thermodynamics track (research: `docs/research/2026-11-13-thermo-research.md`)

- [x] T1. `sim/thermo.js`: Antoine vapor pressure (NIST water) + Kw(T) table, with tests. (2026-11-13)
- [ ] T2. pH CSTR physics model (reaction invariants + charge balance) as a loop-lab process; compare with the paper's FOPDT fit.
- [ ] T3. Heat exchanger: ε-NTU calculator, then lumped dynamic model for temperature control.
- [ ] T4. Exothermic CSTR: G(T)/R(T) multiplicity plot + jacket temperature PID.
