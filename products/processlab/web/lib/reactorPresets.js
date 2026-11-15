/** Reactors tab scenarios. Each teaches one idea; the note says what to look at. */
export const REACTOR_PRESETS = [
  {
    id: 'ph-hold', label: 'pH: hold 7',
    note: 'A PI loop adds base to hold pH 7. At 10 min the acid feed gets 20% stronger; the loop raises the base flow and pulls pH back.',
    p: { reactor: 'ph', loop: true, sp: 7, Kc: 0.1, tauI: 5, dead: 0, manual: 1, disturb: true, tEnd: 120 },
  },
  {
    id: 'ph-lag', label: 'pH: why it is hard',
    note: 'Same tuning with a 0.5 min sensor delay. Near pH 7 the gain is thousands of times larger than near pH 3, so the loop swings between acid and base.',
    p: { reactor: 'ph', loop: true, sp: 7, Kc: 0.1, tauI: 5, dead: 0.5, manual: 1, disturb: true, tEnd: 120 },
  },
  {
    id: 'ph-open', label: 'pH: 1% extra base',
    note: 'Loop off, base flow set 1% above neutral (1.01 L/min). The pH climbs from 7 to about 9.7: a tiny flow error is a huge pH error.',
    p: { reactor: 'ph', loop: false, sp: 7, Kc: 0.1, tauI: 5, dead: 0, manual: 1.01, disturb: false, tEnd: 120 },
  },
  {
    id: 'cstr-hold', label: 'Reactor: hold 350 K',
    note: '350 K is an unstable operating point of this exothermic reactor. A PI loop on the coolant temperature holds it, even when the feed gets 5 K hotter at 5 min.',
    p: { reactor: 'cstr', loop: true, sp: 350, Kc: 5, tauI: 1, dead: 0, manual: 300, disturb: true, tEnd: 30 },
  },
  {
    id: 'cstr-drift', label: 'Reactor: loop off',
    note: 'Same point with the loop off and the reactor 0.5 K hot. It ignites, peaks above 430 K, then falls to the cold, low-conversion steady state.',
    p: { reactor: 'cstr', loop: false, sp: 350, Kc: 5, tauI: 1, dead: 0, manual: 300, disturb: false, tEnd: 30, T0: 350.5 },
  },
  {
    id: 'cstr-runaway', label: 'Reactor: runaway',
    note: 'Starting cold and stable, the coolant is set to 305 K. Past about 303 K the cold steady state disappears: the reactor runs away and keeps oscillating.',
    p: { reactor: 'cstr', loop: false, sp: 350, Kc: 5, tauI: 1, dead: 0, manual: 305, disturb: false, tEnd: 30, CA0: 0.8773, T0: 324.48 },
  },
];
