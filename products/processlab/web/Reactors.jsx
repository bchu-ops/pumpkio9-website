import React, { useMemo, useState } from 'react';
import LoopPlot from './LoopPlot';
import ParamSlider from './ParamSlider';
import { createPid } from './lib/pid';
import { simulateLoop, simulateOpenLoop } from './lib/simulate';
import { exothermicCstr, phCstr } from './lib/reactors';
import { REACTOR_PRESETS } from './lib/reactorPresets';

// Fixed time steps [min]. pH needs a short controller sample time: near pH 7 the gain is so
// steep that a coarse step alone makes the loop chatter.
const DT = { ph: 0.01, cstr: 0.005 };
const RUNAWAY_K = 500; // stop plotting a runaway here (the fixed-step solver can't follow it further)

const REACTORS = {
  ph: {
    label: 'pH neutralization',
    pv: 'pH', mv: 'Base flow [L/min]', mvMin: 0, mvMax: 3, u0: 1, spMin: 4, spMax: 10, manualMin: 0, manualMax: 3,
    kc: [0.005, 2], ti: [0.5, 50],
    make: (p) => phCstr({ V: 20, Fa: 1, Ca: 0.01, Cb: 0.01, x0: 0, disturbAt: p.disturb ? 10 : undefined, CaAfter: 0.012 }),
    disturbLabel: 'Acid feed 20% stronger at 10 min',
    eq: 'V·dx/dt = Fb·Cb − Fa·Ca − (Fa + Fb)·x, x = [Na⁺] − [Cl⁻]; pH from [H⁺] − Kw/[H⁺] + x = 0 (V 20 L, Fa 1 L/min, 0.01 M HCl and NaOH).',
  },
  cstr: {
    label: 'Exothermic reactor',
    pv: 'Reactor T [K]', mv: 'Coolant T [K]', mvMin: 250, mvMax: 350, u0: 300, spMin: 320, spMax: 380, manualMin: 280, manualMax: 320,
    kc: [0.5, 50], ti: [0.1, 20],
    make: (p) => exothermicCstr({ CA0: p.CA0 ?? 0.5, T0: p.T0 ?? 350, disturbAt: p.disturb ? 5 : undefined, TiAfter: 355 }),
    disturbLabel: 'Feed 5 K hotter at 5 min',
    eq: 'dCA/dt = (q/V)(CAi − CA) − k·CA; dT/dt = (q/V)(Ti − T) + (−ΔH/ρCp)·k·CA + (UA/VρCp)(Tc − T); k = k0·e^(−E/RT) (Seborg et al. Example 2.5 parameters).',
  },
};

function runReactor(p) {
  const R = REACTORS[p.reactor];
  const dt = DT[p.reactor];
  const process = R.make(p);
  const run = p.loop
    ? simulateLoop({ process, dt, tEnd: p.tEnd, sp: p.sp, deadTime: p.dead, u0: R.u0,
      pid: createPid({ Kc: p.Kc, tauI: p.tauI, uMin: R.mvMin, uMax: R.mvMax, bias: R.u0 }) })
    : simulateOpenLoop({ process, dt, tEnd: p.tEnd, u: p.manual, deadTime: p.dead, u0: R.u0 });
  // Cut the run where a runaway leaves the range the solver handles.
  const bad = run.pv.findIndex((v) => !Number.isFinite(v) || (p.reactor === 'cstr' && v > RUNAWAY_K));
  const end = bad < 0 ? run.t.length : Math.max(1, bad);
  // A finite value above the limit is a physical runaway; anything else is a numerical failure.
  const stopped = bad < 0 ? null : (Number.isFinite(run.pv[bad]) ? 'runaway' : 'numerical');
  const cut = (a) => a.slice(0, end);
  return { t: cut(run.t), pv: cut(run.pv), u: cut(run.u), sp: p.loop ? cut(run.t).map(() => p.sp) : null, stopped };
}

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export default function Reactors() {
  const [preset, setPreset] = useState(REACTOR_PRESETS[0]);
  const [p, setP] = useState(REACTOR_PRESETS[0].p);
  const set = (k) => (v) => setP((prev) => ({ ...prev, [k]: v }));
  const R = REACTORS[p.reactor];
  const run = useMemo(() => runReactor(p), [p]);
  const choose = (pr) => { setPreset(pr); setP(pr.p); };
  const switchReactor = (id) => choose(REACTOR_PRESETS.find((pr) => pr.p.reactor === id));

  const panels = useMemo(() => [
    { title: R.pv, series: [...(run.sp ? [{ data: run.sp, color: '--cl-sp', dash: [6, 4], width: 1.25 }] : []), { data: run.pv, color: '--cl-pv', width: 2 }] },
    { title: R.mv, series: [{ data: run.u, color: '--cl-mv' }] },
  ], [run, R]);
  const tail = run.pv.slice(Math.floor(run.pv.length * 0.8));
  const swing = Math.max(...tail) - Math.min(...tail);

  return (
    <>
      <p className="cl-lede">Two nonlinear reactors where control gets hard: pH, whose gain changes by orders of magnitude near neutral, and an exothermic reactor that can run away.</p>
      <div className="cl-presets" role="group" aria-label="Reactor scenarios">
        {REACTOR_PRESETS.map((pr) => (
          <button key={pr.id} type="button" className={`cl-chip${pr.id === preset.id ? ' is-active' : ''}`} aria-pressed={pr.id === preset.id} onClick={() => choose(pr)}>{pr.label}</button>
        ))}
      </div>
      <p className="cl-note">{preset.note}</p>

      <div className="cl-grid">
        <section className="cl-figure" aria-label="Reactor response">
          <LoopPlot t={run.t} panels={panels} xLabel="time [min]" summary={`${R.label}: final ${R.pv} ${fmt(run.pv.at(-1))}${run.stopped === 'runaway' ? ', reactor ran away' : ''}.`} />
          <dl className="cl-readouts">
            <div><dt>Final {R.pv}</dt><dd>{fmt(run.pv.at(-1))}</dd></div>
            <div><dt>Peak</dt><dd>{fmt(Math.max(...run.pv))}</dd></div>
            <div><dt>Swing, last 20%</dt><dd>{fmt(swing)}</dd></div>
            <div><dt>Final {p.reactor === 'ph' ? 'base flow' : 'coolant T'}</dt><dd>{fmt(run.u.at(-1))}</dd></div>
          </dl>
          {run.stopped === 'runaway' && <p className="cl-warn" role="status">The reactor ran away (above {RUNAWAY_K} K). The run is stopped there.</p>}
          {run.stopped === 'numerical' && <p className="cl-warn" role="status">The simulation became numerically unstable with these settings, so it is stopped there. Try a smaller gain or less sensor delay.</p>}
        </section>

        <section className="cl-controls" aria-label="Reactor settings">
          <h2>Reactor</h2>
          <label className="cl-param-label" htmlFor="rx-type">Type</label>
          <select id="rx-type" className="cl-select" value={p.reactor} onChange={(e) => switchReactor(e.target.value)}>
            {Object.entries(REACTORS).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
          </select>
          <label className="cl-check"><input type="checkbox" checked={p.disturb} onChange={(e) => set('disturb')(e.target.checked)} /> {R.disturbLabel}</label>

          <h2>Control</h2>
          <label className="cl-check"><input type="checkbox" checked={p.loop} onChange={(e) => set('loop')(e.target.checked)} /> PI loop on</label>
          {p.loop ? (
            <>
              <ParamSlider id="rx-sp" label={`Setpoint, ${R.pv}`} unit="" value={p.sp} min={R.spMin} max={R.spMax} onChange={set('sp')} />
              <ParamSlider id="rx-kc" label="Kc, gain" unit="-" value={p.Kc} min={R.kc[0]} max={R.kc[1]} log onChange={set('Kc')} />
              <ParamSlider id="rx-ti" label="τI, integral time" unit="min" value={p.tauI} min={R.ti[0]} max={R.ti[1]} log onChange={set('tauI')} />
            </>
          ) : (
            <ParamSlider id="rx-manual" label={`Manual ${R.mv}`} unit="" value={p.manual} min={R.manualMin} max={R.manualMax} onChange={set('manual')} />
          )}
          <ParamSlider id="rx-dead" label="Sensor delay" unit="min" value={p.dead} min={0} max={2} onChange={set('dead')} />
          <button type="button" className="cl-reset" onClick={() => choose(preset)}>Reset scenario</button>
        </section>
      </div>

      <details className="cl-details">
        <summary>Equations, data and limits</summary>
        <p><strong>pH neutralization:</strong> {REACTORS.ph.eq} Model form from Faanes &amp; Skogestad, Comput. Chem. Eng. 28 (2004), App. A.</p>
        <p><strong>Exothermic reactor:</strong> {REACTORS.cstr.eq} q = V = 100 (L/min, L), CAi 1 mol/L, Ti 350 K, ΔH −5×10⁴ J/mol, E/R 8750 K, k0 7.2×10¹⁰ min⁻¹, UA 5×10⁴ J/(min·K) (as given by J. Kantor, Notre Dame CBE 30338). At Tc = 300 K it has three steady states; 350 K is the unstable middle one.</p>
        <p><strong>Controller:</strong> ideal PI with anti-windup, output limits 0–3 L/min (pH) or 250–350 K (coolant), started at the steady input.</p>
        <p><strong>Limits:</strong> perfect mixing, constant volume and properties, no jacket dynamics. Runs are cut above {RUNAWAY_K} K, where the fixed-step solver can no longer follow the reaction rate.</p>
      </details>
    </>
  );
}
