/**
 * Series flowsheet simulator with heat loss, phase change and multiple PID loops.
 * Units are stepped in order each dt; a valve directly after a tank is that tank's outlet valve.
 * Returns time series, final streams, per-unit duties and an energy balance [W].
 */
import { createPid } from './pid';
import { FLUIDS } from './fluids';
import {
  HEATER_LAG, PIPE_CELLS, boilT, defaultParams, enthalpy, heaterOut, hxOut, pipeUA, tankOutflow, tankUA,
} from './units';

const withDefaults = (u) => ({ ...u, params: { ...defaultParams(u.type), ...u.params } });

function initState(u, Tamb) {
  if (u.type === 'tank') return { h: u.params.h0, T: u.params.T0 };
  if (u.type === 'heater') return { p: u.params.powerKw };
  if (u.type === 'pipe') return { cells: new Array(PIPE_CELLS).fill(Tamb) };
  return {};
}

const MANUAL = { valve: (p) => p.opening / 100, heater: (p) => p.powerKw / p.maxKw, hx: (p) => p.utilPct / 100 };

function stepTank(s, inlet, p, opening, dt, Tamb) {
  const fluid = inlet.fluid;
  const tb = boilT(fluid);
  const mLiq = inlet.m * (1 - inlet.x);
  const vent = inlet.m * inlet.x * (fluid.cp * tb + fluid.hvap);
  const a = p.outletCm2 * 1e-4;
  const deriv = (h, T) => {
    let qOut = tankOutflow({ h, a, opening });
    let dh = (mLiq / fluid.rho - qOut) / p.area;
    if (h >= p.hMax && dh > 0) { qOut = mLiq / fluid.rho; dh = 0; }
    const M = fluid.rho * p.area * Math.max(h, 1e-3);
    const loss = tankUA(p, h) * (T - Tamb);
    const dT = (mLiq * fluid.cp * (inlet.T - T) - loss) / (M * fluid.cp);
    return { dh, dT, qOut, loss };
  };
  const k1 = deriv(s.h, s.T);
  const k2 = deriv(s.h + (dt / 2) * k1.dh, s.T + (dt / 2) * k1.dT);
  const k3 = deriv(s.h + (dt / 2) * k2.dh, s.T + (dt / 2) * k2.dT);
  const k4 = deriv(s.h + dt * k3.dh, s.T + dt * k3.dT);
  const out = { m: k1.qOut * fluid.rho, T: s.T, x: 0, fluid };
  const level = s.h;
  s.h = Math.min(p.hMax, Math.max(0, s.h + (dt / 6) * (k1.dh + 2 * k2.dh + 2 * k3.dh + k4.dh)));
  s.T = Math.min(tb, s.T + (dt / 6) * (k1.dT + 2 * k2.dT + 2 * k3.dT + k4.dT)); // no boiling inside tanks
  return { out, level, loss: k1.loss, vent };
}

/** Pipe as N mixed cells, implicit (backward Euler) so any dt is stable. Two-phase flow passes through unchanged. */
function stepPipe(s, inlet, p, dt, Tamb) {
  if (inlet.x > 0) return { out: { ...inlet }, loss: 0 };
  const { fluid } = inlet;
  const uaCell = pipeUA(p) / PIPE_CELLS;
  const mCell = fluid.rho * Math.PI * (p.diamMm / 1000) ** 2 / 4 * (p.length / PIPE_CELLS);
  const mcp = inlet.m * fluid.cp;
  let upstream = inlet.T;
  let loss = 0;
  s.cells = s.cells.map((T) => {
    const cap = (mCell * fluid.cp) / dt;
    const next = (cap * T + mcp * upstream + uaCell * Tamb) / (cap + mcp + uaCell);
    loss += uaCell * (next - Tamb);
    upstream = next;
    return next;
  });
  return { out: { ...inlet, T: upstream }, loss };
}

export function simulateFlowsheet({ units: raw, loops = [], env = { Tamb: 20 }, dt, tEnd }) {
  const { Tamb } = env;
  const units = raw.map(withDefaults);
  const state = Object.fromEntries(units.map((u) => [u.id, initState(u, Tamb)]));
  const active = loops.map((l) => (l.enabled && l.pv && l.mv
    ? createPid({ Kc: l.Kc, tauI: l.tauI || Infinity, tauD: l.tauD || 0, uMin: 0, uMax: 1 })
    : null));
  const series = { t: [] };
  const push = (k, v) => { (series[k] ||= []).push(v); };
  const steps = Math.round(tEnd / dt);
  let prev = {};
  let streams = {};
  let duties = {};
  let balance = {};

  for (let i = 0; i <= steps; i += 1) {
    const t = i * dt;
    const mvU = {};
    const lastMeasured = prev;
    loops.forEach((l, k) => {
      const pid = active[k];
      const sign = l.reverse ? -1 : 1;
      const u = pid && i > 0 ? pid.step({ sp: sign * l.sp, pv: sign * lastMeasured[l.pv], dt }) : null;
      if (u !== null) mvU[l.mv] = u;
      push(`loop${k}.u`, pid ? (u ?? 0) * 100 : null);
      push(`loop${k}.sp`, pid ? l.sp : null);
    });
    const uOf = (unit) => (mvU[unit.id] ?? MANUAL[unit.type](unit.params));

    const measured = {};
    const stepStreams = {};
    const stepDuties = {};
    const bal = { in: 0, added: 0, removed: 0, losses: 0, vented: 0, out: 0 };
    let stream = null;
    units.forEach((unit, idx) => {
      const p = unit.params;
      const s = state[unit.id];
      const duty = { Q: 0, loss: 0, vent: 0 };
      if (unit.type === 'source') {
        const fluid = FLUIDS[p.fluid] ?? FLUIDS.water;
        stream = { m: (p.flowLps / 1000) * fluid.rho, T: p.stepAt > 0 && t >= p.stepAt ? p.stepT : p.T, x: 0, fluid };
        bal.in = stream.m * enthalpy(fluid, stream.T);
      } else if (unit.type === 'valve') {
        if (units[idx - 1]?.type !== 'tank') stream = { ...stream, m: stream.m * uOf(unit) };
      } else if (unit.type === 'heater') {
        duty.Q = stream.m > 1e-9 ? s.p * 1000 : 0;
        stream = heaterOut(stream, duty.Q);
        bal.added += duty.Q;
        s.p += (dt / HEATER_LAG) * (uOf(unit) * p.maxKw - s.p);
      } else if (unit.type === 'hx') {
        const r = hxOut(stream, p, uOf(unit));
        stream = r.out;
        duty.Q = -r.Q;
        bal.removed += r.Q;
      } else if (unit.type === 'pipe') {
        const r = stepPipe(s, stream, p, dt, Tamb);
        stream = r.out;
        duty.loss = r.loss;
      } else if (unit.type === 'tank') {
        const next = units[idx + 1];
        const r = stepTank(s, stream, p, next?.type === 'valve' ? uOf(next) : 1, dt, Tamb);
        stream = r.out;
        duty.loss = r.loss;
        duty.vent = r.vent;
        measured[`${unit.id}.level`] = r.level;
      } else if (unit.type === 'sink') {
        bal.out = stream.m * enthalpy(stream.fluid, stream.T, stream.x);
      }
      bal.losses += duty.loss;
      bal.vented += duty.vent;
      stepDuties[unit.id] = duty;
      if (unit.type !== 'sink') {
        stepStreams[unit.id] = stream;
        measured[`${unit.id}.T`] = stream.T;
        measured[`${unit.id}.q`] = ((stream.m * (1 - stream.x)) / stream.fluid.rho) * 1000;
        measured[`${unit.id}.x`] = stream.x;
      }
    });

    series.t.push(t);
    Object.entries(measured).forEach(([k, v]) => push(k, v));
    prev = measured;
    streams = stepStreams;
    duties = stepDuties;
    balance = bal;
  }
  return { series, streams, duties, balance, units };
}
