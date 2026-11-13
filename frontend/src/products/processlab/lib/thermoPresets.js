/** Thermo & materials scenarios. Each teaches one idea; the note says what to try. */
export const BUILDER_PRESETS = [
  {
    id: 'insulation', label: 'Insulation matters',
    note: 'Hot water loses heat through a 100 m bare steel pipe. Select the pipe and add 50 mm of mineral wool: the outlet stays much hotter.',
    tEnd: 1800, watch: 'p1.T',
    units: [
      { id: 'src', type: 'source', params: { fluid: 'water', flowLps: 0.05, T: 80 } },
      { id: 'p1', type: 'pipe', params: { length: 100, diamMm: 25, wall: 'carbonSteel', wallMm: 3, ins: 'none', insMm: 0 } },
      { id: 'snk', type: 'sink', params: {} },
    ],
    loops: [],
  },
  {
    id: 'boil', label: 'Boiling point by fluid',
    note: 'The same 30 kW heater boils part of the ethanol stream (it boils at 78 °C, with a third of water’s latent heat). Switch the source fluid to water: no boiling.',
    tEnd: 120, watch: 'h1.x',
    units: [
      { id: 'src', type: 'source', params: { fluid: 'ethanol', flowLps: 0.1, T: 20 } },
      { id: 'h1', type: 'heater', params: { powerKw: 30, maxKw: 100 } },
      { id: 'snk', type: 'sink', params: {} },
    ],
    loops: [],
  },
  {
    id: 'heated', label: 'Heated tank + PID',
    note: 'A PID holds the tank at 45 °C. At 600 s the supply cools from 15 to 5 °C. Try glass vs stainless walls, or add insulation, and compare the heater output.',
    tEnd: 1500, watch: 'tk1.T',
    units: [
      { id: 'src', type: 'source', params: { fluid: 'water', flowLps: 1, T: 15, stepAt: 600, stepT: 5 } },
      { id: 'h1', type: 'heater', params: { powerKw: 60, maxKw: 250 } },
      { id: 'tk1', type: 'tank', params: { area: 0.5, outletCm2: 10, hMax: 2, h0: 0.121, T0: 30, wall: 'stainless', wallMm: 3, ins: 'none', insMm: 0 } },
      { id: 'snk', type: 'sink', params: {} },
    ],
    loops: [{ enabled: true, pv: 'tk1.T', mv: 'h1', sp: 45, Kc: 0.05, tauI: 60, reverse: false }],
  },
  {
    id: 'cooling', label: 'Exchanger + pipe delay',
    note: 'An 80 °C stream is cooled to 40 °C against 10 °C utility water. The pipe after the exchanger adds transport delay, so the loop needs gentle tuning: raise Kc to 0.02 and it oscillates. Try copper vs stainless plates.',
    tEnd: 1500, watch: 'p1.T',
    units: [
      { id: 'src', type: 'source', params: { fluid: 'water', flowLps: 1, T: 80 } },
      { id: 'hx1', type: 'hx', params: { area: 8, wall: 'stainless', wallMm: 1, utilT: 10, utilLps: 3, utilPct: 30 } },
      { id: 'p1', type: 'pipe', params: { length: 30, diamMm: 50, wall: 'stainless', wallMm: 2, ins: 'mineralWool', insMm: 30 } },
      { id: 'snk', type: 'sink', params: {} },
    ],
    loops: [{ enabled: true, pv: 'p1.T', mv: 'hx1', sp: 40, Kc: 0.006, tauI: 60, reverse: true }],
  },
  {
    id: 'twoloops', label: 'Level + temperature',
    note: 'Two PID loops at once: the inlet valve holds the tank level at 2 m, and the heater holds 50 °C. Changing one disturbs the other.',
    tEnd: 2400, watch: 'tk1.T',
    units: [
      { id: 'src', type: 'source', params: { fluid: 'water', flowLps: 8, T: 15 } },
      { id: 'v1', type: 'valve', params: { opening: 50 } },
      { id: 'h1', type: 'heater', params: { powerKw: 0, maxKw: 1000 } },
      { id: 'tk1', type: 'tank', params: { area: 0.5, outletCm2: 10, hMax: 4, h0: 1, T0: 30, wall: 'stainless', wallMm: 3, ins: 'none', insMm: 0 } },
      { id: 'snk', type: 'sink', params: {} },
    ],
    loops: [
      { enabled: true, pv: 'tk1.level', mv: 'v1', sp: 2, Kc: 1, tauI: 120, reverse: false },
      { enabled: true, pv: 'tk1.T', mv: 'h1', sp: 50, Kc: 0.05, tauI: 120, reverse: false },
    ],
  },
];
