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
    note: 'Same gains, more dead time: the loop starts to oscillate.',
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
];

export const DEFAULT_PRESET = PRESETS[0];
