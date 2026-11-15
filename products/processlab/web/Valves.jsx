import React, { useMemo, useState } from 'react';
import LoopPlot from './LoopPlot';
import ParamSlider from './ParamSlider';
import { VALVE_STYLES, inherent, installed, sizeLiquidValve } from './lib/valves';

const OPENINGS = Array.from({ length: 101 }, (_, i) => i / 100);
const OPENINGS_PCT = OPENINGS.map((x) => x * 100); // stable x-axis so the plot only redraws when N or R change
const CHARS = [
  { id: 'linear', label: 'Linear', color: '--cl-pv' },
  { id: 'equal', label: 'Equal percentage', color: '--cl-mv' },
  { id: 'quick', label: 'Quick opening', color: '--cl-sp', dash: [6, 4] },
];

const DEFAULTS = { q: 50, P1: 6, P2: 4, Pv: 0.0317, Gf: 1, style: 'globe', N: 0.3, R: 50 };

const STATUS = {
  ok: { text: 'Not choked. Check the valve maker’s cavitation limit (σ) for this valve.', warn: false },
  choked: { text: 'Choked flow from cavitation: more pressure drop gives no more flow. Sized with the choked ΔP; expect noise and damage, consider a valve with a higher FL or splitting the pressure drop.', warn: true },
  flashing: { text: 'Flashing: outlet pressure is below the vapor pressure, so the liquid partly boils. Sized with the choked ΔP; needs a valve rated for flashing service.', warn: true },
};

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

function Sizing({ v, set }) {
  const style = VALVE_STYLES[v.style];
  const r = sizeLiquidValve({ q: v.q, P1: v.P1, P2: v.P2, Pv: v.Pv, Gf: v.Gf, FL: style.FL });
  const status = r.error ? null : STATUS[r.status];
  return (
    <section aria-label="Valve sizing">
      <h3 className="vl-heading">Size a valve for liquid flow</h3>
      <div className="cl-grid">
        <div className="cl-figure">
          {r.error ? <p className="cl-warn" role="alert">{r.error}</p> : (
            <>
              <dl className="cl-readouts">
                <div><dt>Required Kv</dt><dd>{fmt(r.Kv, 1)} m³/h</dd></div>
                <div><dt>Required Cv</dt><dd>{fmt(r.Cv, 1)}</dd></div>
                <div><dt>Choked ΔP limit</dt><dd>{fmt(r.dPch)} bar</dd></div>
                <div><dt>Cavitation index σ</dt><dd>{fmt(r.sigma)}</dd></div>
              </dl>
              <p className={status.warn ? 'cl-warn' : 'cl-note'} role="status">{status.text}</p>
              <p className="cl-note">
                σ = (P1 − Pv)/(P1 − P2) = {fmt(r.sigma)}; this valve style chokes near σ ≈ 1/FL² = {fmt(r.sigmaChoked)}.
                Lower σ means more cavitation risk.
              </p>
            </>
          )}
        </div>
        <div className="cl-controls">
          <h2>Operating point</h2>
          <ParamSlider id="vl-q" label="Flow, q" unit="m³/h" value={v.q} min={1} max={500} log onChange={set('q')} />
          <ParamSlider id="vl-p1" label="Inlet pressure, P1" unit="bar(a)" value={v.P1} min={1} max={40} onChange={set('P1')} />
          <ParamSlider id="vl-p2" label="Outlet pressure, P2" unit="bar(a)" value={v.P2} min={0.01} max={39} onChange={set('P2')} />
          <ParamSlider id="vl-pv" label="Vapor pressure, Pv" unit="bar(a)" value={v.Pv} min={0.001} max={5} log onChange={set('Pv')} />
          <ParamSlider id="vl-gf" label="Specific gravity, Gf" unit="-" value={v.Gf} min={0.5} max={1.5} onChange={set('Gf')} />
          <label className="cl-param-label" htmlFor="vl-style">Valve style (typical FL)</label>
          <select id="vl-style" className="cl-select" value={v.style} onChange={(e) => set('style')(e.target.value)}>
            {Object.entries(VALVE_STYLES).map(([k, s]) => <option key={k} value={k}>{s.name}, FL {s.FL}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}

function Characteristics({ v, set }) {
  const panels = useMemo(() => [
    { title: 'Inherent: flow vs opening at constant ΔP', series: CHARS.map((c) => ({ data: OPENINGS.map((x) => inherent(c.id, x, v.R)), color: c.color, dash: c.dash })) },
    { title: `Installed: with piping, valve authority N = ${v.N}`, series: CHARS.map((c) => ({ data: OPENINGS.map((x) => installed(inherent(c.id, x, v.R), v.N)), color: c.color, dash: c.dash })) },
  ], [v.N, v.R]);
  return (
    <section aria-label="Flow characteristics">
      <h3 className="vl-heading">Inherent vs installed characteristic</h3>
      <div className="cl-grid">
        <div className="cl-figure">
          <LoopPlot t={OPENINGS_PCT} panels={panels} xLabel="opening [%]" summary={`Relative flow versus valve opening for linear, equal-percentage and quick-opening valves, alone and installed with authority ${v.N}.`} />
          <ul className="cl-legend" aria-hidden="true">
            <li><span className="sw sw-pv" />Linear</li>
            <li><span className="sw sw-mv" />Equal percentage</li>
            <li><span className="sw sw-sp" />Quick opening</li>
          </ul>
        </div>
        <div className="cl-controls">
          <h2>Piping</h2>
          <ParamSlider id="vl-n" label="Valve authority, N" unit="-" value={v.N} min={0.05} max={1} onChange={set('N')} />
          <ParamSlider id="vl-r" label="Rangeability, R (equal %)" unit="-" value={v.R} min={10} max={100} onChange={set('R')} />
          <p className="pb-empty">
            N is the share of the system pressure drop taken by the fully open valve. With low N the piping
            dominates: a linear valve starts to act like quick opening, and an equal-percentage valve becomes close to linear.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Valves() {
  const [v, setV] = useState(DEFAULTS);
  const set = (key) => (value) => setV((prev) => ({ ...prev, [key]: value }));
  return (
    <>
      <p className="cl-lede">Size a control valve for a liquid, check for choked flow and cavitation, and see how the piping changes the valve&apos;s flow characteristic.</p>
      <Sizing v={v} set={set} />
      <Characteristics v={v} set={set} />
      <button type="button" className="cl-reset vl-reset" onClick={() => setV(DEFAULTS)}>Reset</button>
      <details className="cl-details">
        <summary>Equations, data and limits</summary>
        <p><strong>Sizing (ISA-75.01.01 / IEC 60534-2-1):</strong> q = Kv·√(ΔP/Gf), q in m³/h, ΔP in bar; Cv = Kv/0.865. Valve assumed line size (Fp = 1) and fully turbulent.</p>
        <p><strong>Choked flow:</strong> ΔPmax = FL²·(P1 − FF·Pv), FF = 0.96 − 0.28·√(Pv/Pc), Pc(water) = 221.1 bar. If ΔP ≥ ΔPmax the valve is sized with ΔPmax.</p>
        <p><strong>Cavitation index (ISA-RP75.23):</strong> σ = (P1 − Pv)/(P1 − P2). Thresholds (incipient, constant, damage) are valve-specific, so only the choking point σ ≈ 1/FL² is shown. Flashing when P2 ≤ Pv.</p>
        <p><strong>Characteristics:</strong> linear f = x, equal percentage f = R^(x−1), quick opening f ≈ √x (idealised). Installed: q = f/√(N + (1 − N)·f²) for a valve in series with fixed piping resistance at constant total ΔP.</p>
        <p><strong>Data:</strong> FL values are typical for each style (IEC 60534-2-1 Table D.1); real values come from the valve maker. Sources: Emerson Fisher Catalog 12 Sec. 2, DeZURIK cavitation guide (ISA-RP75.23), LibreTexts Woolf §3.10.</p>
      </details>
    </>
  );
}
