import React, { useMemo, useState } from 'react';
import LoopPlot from './LoopPlot';
import ParamSlider from './ParamSlider';
import { DEFAULT_PRESET, PRESETS } from './lib/loopPresets';
import { createPid } from './lib/pid';
import { firstOrder, integrating, secondOrder } from './lib/processes';
import { simulateLoop } from './lib/simulate';
import { stepMetrics } from './lib/metrics';

const STEPS = 3000;

const MODELS = {
  first: { label: 'First order', make: (p) => firstOrder({ K: p.K, tau: p.tau }), eq: 'τ·dy/dt = −y + K·u(t − θ)' },
  second: { label: 'Second order', make: (p) => secondOrder({ K: p.K, wn: 1 / p.tau, zeta: p.zeta }), eq: 'τ²·y″ + 2ζτ·y′ + y = K·u(t − θ)' },
  integrating: { label: 'Integrating (level)', make: (p) => integrating({ K: p.K / p.tau }), eq: 'dy/dt = (K/τ)·u(t − θ)' },
};

function runLoop(p) {
  return simulateLoop({
    process: MODELS[p.model].make(p),
    pid: createPid({
      Kc: p.Kc, tauI: p.useI ? p.tauI : Infinity, tauD: p.tauD, uMin: 0, uMax: p.uMax, antiWindup: p.antiWindup,
    }),
    sp: 1,
    dt: p.tEnd / STEPS,
    tEnd: p.tEnd,
    deadTime: p.deadTime,
  });
}

const fmt = (v, unit = '', digits = 2) => (v === null || !Number.isFinite(v) ? '—' : `${v.toFixed(digits)}${unit}`);

export default function LoopLab() {
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [p, setP] = useState(DEFAULT_PRESET.params);
  const set = (key) => (value) => setP((prev) => ({ ...prev, [key]: value }));

  const run = useMemo(() => runLoop(p), [p]);
  const m = useMemo(() => stepMetrics({ t: run.t, pv: run.pv, sp: 1 }), [run]);
  const unstable = run.pv.some((v) => !Number.isFinite(v) || Math.abs(v) > 100);
  const summary = `Closed-loop step response. Overshoot ${fmt(m.overshoot * 100, '%', 0)}, `
    + `settling time ${fmt(m.settlingTime, ' s', 1)}${unstable ? '. Loop is unstable.' : '.'}`;

  const choose = (pr) => { setPreset(pr); setP(pr.params); };

  return (
    <>
        <p className="cl-lede">Tune a PID controller live and watch the process respond. Drag a slider; the whole run recomputes instantly.</p>

        <div className="cl-presets" role="group" aria-label="Scenario presets">
          {PRESETS.map((pr) => (
            <button key={pr.id} type="button" className={`cl-chip${pr.id === preset.id ? ' is-active' : ''}`} aria-pressed={pr.id === preset.id} onClick={() => choose(pr)}>
              {pr.label}
            </button>
          ))}
        </div>
        <p className="cl-note">{preset.note}</p>

        <div className="cl-grid">
          <section className="cl-figure" aria-label="Response plot">
            <LoopPlot
              t={run.t}
              summary={summary}
              panels={[
                { title: 'PV vs SP', series: [{ data: run.sp, color: '--cl-sp', dash: [6, 4] }, { data: run.pv, color: '--cl-pv' }] },
                { title: 'Controller output (MV)', series: [{ data: run.u, color: '--cl-mv' }] },
              ]}
            />
            <ul className="cl-legend" aria-hidden="true">
              <li><span className="sw sw-pv" />PV (measured)</li>
              <li><span className="sw sw-sp" />SP (setpoint)</li>
              <li><span className="sw sw-mv" />MV (valve signal)</li>
            </ul>
            <dl className="cl-readouts">
              <div><dt>Overshoot</dt><dd>{fmt(m.overshoot * 100, '%', 0)}</dd></div>
              <div><dt>Rise 10–90%</dt><dd>{fmt(m.riseTime, ' s', 1)}</dd></div>
              <div><dt>Settling 2%</dt><dd>{fmt(m.settlingTime, ' s', 1)}</dd></div>
              <div><dt>IAE</dt><dd>{fmt(m.iae)}</dd></div>
            </dl>
            {unstable && <p className="cl-warn" role="status">Unstable: the loop gain is too high for this dead time.</p>}
          </section>

          <section className="cl-controls" aria-label="Parameters">
            <h2>Controller</h2>
            <ParamSlider id="kc" label="Kc, gain" unit="-" value={p.Kc} min={0.05} max={50} log onChange={set('Kc')} />
            <label className="cl-check"><input type="checkbox" checked={p.useI} onChange={(e) => set('useI')(e.target.checked)} /> Integral action</label>
            <ParamSlider id="ti" label="τI, integral time" unit="s" value={p.tauI} min={0.5} max={100} log disabled={!p.useI} onChange={set('tauI')} />
            <ParamSlider id="td" label="τD, derivative time" unit="s" value={p.tauD} min={0} max={10} onChange={set('tauD')} />
            <ParamSlider id="umax" label="Valve limit (max MV)" unit="-" value={p.uMax} min={0.5} max={10} onChange={set('uMax')} />
            <label className="cl-check"><input type="checkbox" checked={p.antiWindup} onChange={(e) => set('antiWindup')(e.target.checked)} /> Anti-windup</label>

            <h2>Process</h2>
            <label className="cl-param-label" htmlFor="model">Model</label>
            <select id="model" className="cl-select" value={p.model} onChange={(e) => set('model')(e.target.value)}>
              {Object.entries(MODELS).map(([k, mdl]) => <option key={k} value={k}>{mdl.label}</option>)}
            </select>
            <ParamSlider id="k" label="K, process gain" unit="-" value={p.K} min={0.2} max={5} onChange={set('K')} />
            <ParamSlider id="tau" label="τ, time constant" unit="s" value={p.tau} min={0.5} max={30} log onChange={set('tau')} />
            {p.model === 'second' && <ParamSlider id="zeta" label="ζ, damping ratio" unit="-" value={p.zeta} min={0.05} max={2} onChange={set('zeta')} />}
            <ParamSlider id="theta" label="θ, dead time" unit="s" value={p.deadTime} min={0} max={10} onChange={set('deadTime')} />
            <button type="button" className="cl-reset" onClick={() => choose(preset)}>Reset to preset</button>
          </section>
        </div>

        <details className="cl-details">
          <summary>Equations used</summary>
          <p><strong>Process:</strong> {MODELS[p.model].eq}</p>
          <p><strong>Controller (ideal PID):</strong> u = Kc·[e + (1/τI)∫e dt − τD·dPV/dt]. Derivative acts on PV, filtered with τD/10, so setpoint steps cause no kick.</p>
          <p><strong>Anti-windup:</strong> integration pauses while the valve is saturated and the error would push it further.</p>
          <p><strong>Solver:</strong> fixed-step RK4, {STEPS} steps; dead time as a delay buffer.</p>
        </details>
    </>
  );
}
