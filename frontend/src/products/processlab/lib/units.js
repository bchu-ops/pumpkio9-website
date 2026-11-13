/**
 * Thermo unit models for the Process & Thermo builder.
 * Stream: { m: kg/s, T: °C, x: vapor mass fraction, fluid } at 1 atm.
 * Enthalpy reference: saturated-free liquid at 0 °C, h = cp·T + x·hvap (constant cp, hvap).
 */
import { FLUIDS, WATER } from './fluids';
import { H, INSULATION, WALLS } from './materials';
import { wallU } from './heat';
import { boilingPointC } from './thermo';

export const G = 9.80665; // m/s²
export const P_ATM = 1.01325; // bar
export const HEATER_LAG = 5; // s, element heat-up
export const PIPE_CELLS = 10;
const CD = 0.65; // orifice discharge coefficient, water (Torricelli's law article)

export const boilT = (fluid) => boilingPointC(P_ATM, fluid);
export const enthalpy = (fluid, T, x = 0) => fluid.cp * T + x * fluid.hvap;

/** (T, x) from specific enthalpy at 1 atm. dry = fully vaporized (superheat not modelled). */
export function fromEnthalpy(fluid, h) {
  const tb = boilT(fluid);
  const hLiq = fluid.cp * tb;
  if (h <= hLiq) return { T: h / fluid.cp, x: 0 };
  const x = (h - hLiq) / fluid.hvap;
  return x >= 1 ? { T: tb, x: 1, dry: true } : { T: tb, x };
}

export function heaterOut(s, watts) {
  if (s.m <= 1e-9) return { ...s };
  return { ...s, ...fromEnthalpy(s.fluid, enthalpy(s.fluid, s.T, s.x) + watts / s.m) };
}

/** Torricelli: q = Cd·a·√(2gh) × opening. https://en.wikipedia.org/wiki/Torricelli%27s_law (verified) */
export const tankOutflow = ({ h, a, opening, Cd = CD }) => opening * Cd * a * Math.sqrt(2 * G * Math.max(0, h));

const layers = (p) => [
  { t: (p.wallMm ?? 3) / 1000, k: WALLS[p.wall ?? 'stainless'].k },
  { t: p.ins && p.ins !== 'none' ? (p.insMm ?? 0) / 1000 : 0, k: INSULATION[p.ins ?? 'none'].k },
];

/** Cylindrical open tank: wetted area = bottom + side up to level h. Inside liquid free convection, outside still air. */
export function tankUA(p, h) {
  const D = Math.sqrt((4 * p.area) / Math.PI);
  const area = p.area + Math.PI * D * Math.max(0, h);
  return wallU({ hIn: H.waterFree, hOut: H.airFree, layers: layers(p) }) * area;
}

/** Pipe outer surface (thin wall): forced flow inside, still air outside. */
export const pipeUA = (p) => wallU({ hIn: H.waterForced, hOut: H.airFree, layers: layers(p) }) * Math.PI * (p.diamMm / 1000) * p.length;

/** Exchanger plate: forced liquid on both sides plus wall conduction. */
export const hxUA = (p) => wallU({ hIn: H.waterForced, hOut: H.waterForced, layers: layers({ ...p, ins: 'none' }) }) * p.area;

/** Counterflow ε-NTU. https://en.wikipedia.org/wiki/NTU_method (verified) */
export function hxEffectivenessCounterflow(ntu, cr) {
  if (Math.abs(1 - cr) < 1e-9) return ntu / (1 + ntu);
  const e = Math.exp(-ntu * (1 - cr));
  return (1 - e) / (1 - cr * e);
}

/** Process stream against utility water. Returns outlet stream and heat removed Q [W]. */
export function hxOut(s, p, utilFraction) {
  const cP = s.m * s.fluid.cp;
  const cU = (p.utilLps / 1000) * utilFraction * WATER.rho * WATER.cp;
  if (cP <= 1e-9 || cU <= 1e-9) return { out: { ...s }, Q: 0 };
  const cMin = Math.min(cP, cU);
  const eps = hxEffectivenessCounterflow(hxUA(p) / cMin, cMin / Math.max(cP, cU));
  const Q = eps * cMin * (s.T - p.utilT);
  return { out: { ...s, ...fromEnthalpy(s.fluid, enthalpy(s.fluid, s.T, s.x) - Q / s.m) }, Q };
}

const opts = (table) => Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v.name]));
const WALL_PARAMS = [
  { key: 'wall', label: 'Wall material', options: opts(WALLS), def: 'stainless' },
  { key: 'wallMm', label: 'Wall thickness', unit: 'mm', min: 0.5, max: 20, def: 3 },
];
const INS_PARAMS = [
  { key: 'ins', label: 'Insulation', options: opts(INSULATION), def: 'none' },
  { key: 'insMm', label: 'Insulation thickness', unit: 'mm', min: 0, max: 150, def: 0 },
];

/** Block catalog for the UI. `mv` names what a PID can manipulate. */
export const UNIT_TYPES = {
  source: {
    label: 'Source', icon: '◉', fixed: true,
    params: [
      { key: 'fluid', label: 'Fluid', options: opts(FLUIDS), def: 'water' },
      { key: 'flowLps', label: 'Supply flow (valve fully open)', unit: 'L/s', min: 0.05, max: 20, log: true, def: 2 },
      { key: 'T', label: 'Supply temperature', unit: '°C', min: 1, max: 95, def: 20 },
      { key: 'stepAt', label: 'Disturbance time (0 = none)', unit: 's', min: 0, max: 3600, def: 0 },
      { key: 'stepT', label: 'Supply T after disturbance', unit: '°C', min: 1, max: 95, def: 10 },
    ],
  },
  valve: { label: 'Valve', icon: '⋈', mv: 'opening', manual: 'opening', params: [{ key: 'opening', label: 'Opening (manual)', unit: '%', min: 0, max: 100, def: 50 }] },
  heater: {
    label: 'Heater', icon: '♨', mv: 'power', manual: 'powerKw',
    params: [
      { key: 'powerKw', label: 'Power (manual)', unit: 'kW', min: 0, max: 1000, def: 20 },
      { key: 'maxKw', label: 'Max power', unit: 'kW', min: 1, max: 1000, log: true, def: 100 },
    ],
  },
  hx: {
    label: 'Heat exchanger', icon: '⇄', mv: 'utility flow', manual: 'utilPct',
    params: [
      { key: 'area', label: 'Plate area', unit: 'm²', min: 0.1, max: 20, log: true, def: 2 },
      ...WALL_PARAMS,
      { key: 'utilT', label: 'Utility water inlet', unit: '°C', min: 1, max: 95, def: 10 },
      { key: 'utilLps', label: 'Utility flow (max)', unit: 'L/s', min: 0.1, max: 20, def: 2 },
      { key: 'utilPct', label: 'Utility valve (manual)', unit: '%', min: 0, max: 100, def: 50 },
    ],
  },
  pipe: {
    label: 'Pipe', icon: '═',
    params: [
      { key: 'length', label: 'Length', unit: 'm', min: 1, max: 500, log: true, def: 30 },
      { key: 'diamMm', label: 'Inner diameter', unit: 'mm', min: 10, max: 300, log: true, def: 50 },
      ...WALL_PARAMS, ...INS_PARAMS,
    ],
  },
  tank: {
    label: 'Tank', icon: '▭', states: ['level', 'T'],
    params: [
      { key: 'area', label: 'Cross-section area', unit: 'm²', min: 0.1, max: 10, log: true, def: 1 },
      { key: 'outletCm2', label: 'Outlet hole area', unit: 'cm²', min: 1, max: 100, log: true, def: 10 },
      { key: 'hMax', label: 'Height (overflow)', unit: 'm', min: 0.5, max: 10, def: 4 },
      { key: 'h0', label: 'Initial level', unit: 'm', min: 0, max: 10, def: 1 },
      { key: 'T0', label: 'Initial temperature', unit: '°C', min: 1, max: 95, def: 20 },
      ...WALL_PARAMS, ...INS_PARAMS,
    ],
  },
  sink: { label: 'Sink', icon: '◎', fixed: true, params: [] },
};

export const defaultParams = (type) => Object.fromEntries(UNIT_TYPES[type].params.map((p) => [p.key, p.def]));
