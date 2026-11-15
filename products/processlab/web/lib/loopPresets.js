/** Scenario presets. Each is a full parameter set so "Reset" is just a preset. */
export const PRESETS = [
  {
    id: 'overshoot', label: 'PI with overshoot',
    note: 'A typical first try: fast, but it overshoots before settling.',
    params: { model: 'first', K: 1, tau: 5, zeta: 0.5, deadTime: 1, Kc: 3, tauI: 4, useI: true, tauD: 0, uMax: 5, antiWindup: true, tEnd: 40 },
  },
  {
    id: 'tuned', label: 'Well tuned',
    note: 'Gentler gain and τI = τ: little overshoot, no offset.',
    params: { model: 'first', K: 1, tau: 5, zeta: 0.5, deadTime: 1, Kc: 1.5, tauI: 5, useI: true, tauD: 0, uMax: 5, antiWindup: true, tEnd: 40 },
  },
  {
    id: 'ponly', label: 'P-only offset',
    note: 'Without integral action PV settles short of SP by 1/(1+Kc·K).',
    params: { model: 'first', K: 1, tau: 5, zeta: 0.5, deadTime: 0, Kc: 4, tauI: 5, useI: false, tauD: 0, uMax: 10, antiWindup: true, tEnd: 30 },
  },
  {
    id: 'deadtime', label: 'Dead time',
    note: 'Same gains, more dead time: the loop goes unstable, and the valve limits turn that into a steady oscillation.',
    params: { model: 'first', K: 1, tau: 5, zeta: 0.5, deadTime: 3.5, Kc: 3, tauI: 4, useI: true, tauD: 0, uMax: 10, antiWindup: true, tEnd: 80 },
  },
  {
    id: 'windup', label: 'Integral windup',
    note: 'The valve saturates and the integral keeps growing. Toggle anti-windup to compare.',
    params: { model: 'first', K: 1, tau: 5, zeta: 0.5, deadTime: 0, Kc: 3, tauI: 2, useI: true, tauD: 0, uMax: 1.2, antiWindup: false, tEnd: 60 },
  },
  {
    id: 'second', label: 'Underdamped + PID',
    note: 'An oscillatory process. Derivative action adds damping.',
    params: { model: 'second', K: 1, tau: 2, zeta: 0.3, deadTime: 0, Kc: 1, tauI: 4, useI: true, tauD: 1, uMax: 10, antiWindup: true, tEnd: 40 },
  },
  // Brian's pH control lab (UCSD): FOPDT fit from ramp tests K = 0.03 ΔpH per % controller output,
  // τ = 4.6 s, θ = 4 s; PD settings Kc = 28, τD = 4.6 s from that fit. MV in % output (0–100).
  {
    id: 'phpaper', label: 'My pH paper: as fitted',
    note: 'From my pH control lab: the FOPDT fit (K 0.03, τ 4.6 s, θ 4 s) with the paper’s PD settings (Kc 28, τD 4.6 s). PV stalls near half the step: a FOPDT model needs integral action. Try SIMC PI in the tuning rules below.',
    params: { model: 'first', K: 0.03, tau: 4.6, zeta: 0.5, deadTime: 4, Kc: 28, tauI: 4.6, useI: false, tauD: 4.6, uMax: 100, antiWindup: true, tEnd: 150 },
  },
  {
    id: 'phpaperint', label: 'My pH paper: integrating',
    note: 'The paper found the tank self-integrating (acid and base accumulate). With the same numbers as an integrator (rate K/τ), the PD settings reach setpoint with no overshoot: rise about 12 s and settling about 26 s, close to the 15 s and 30 s measured in the lab.',
    params: { model: 'integrating', K: 0.03, tau: 4.6, zeta: 0.5, deadTime: 4, Kc: 28, tauI: 4.6, useI: false, tauD: 4.6, uMax: 100, antiWindup: true, tEnd: 150 },
  },
];

export const DEFAULT_PRESET = PRESETS[0];
