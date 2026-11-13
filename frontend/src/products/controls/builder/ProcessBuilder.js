import React, { useMemo, useRef, useState } from 'react';
import LoopPlot from '../LoopPlot';
import ParamSlider from '../ParamSlider';
import BlockDiagram from './BlockDiagram';
import { LoopInspector, UnitInspector } from './Inspector';
import StreamTable from './StreamTable';
import { BUILDER_PRESETS } from './presets';
import { simulateFlowsheet } from './flowsheet';
import { UNIT_TYPES, defaultParams } from './units';

const ADDABLE = ['valve', 'heater', 'hx', 'pipe', 'tank'];
const KINDS = {
  level: { label: 'level', unit: 'm', min: 0, max: 10 },
  T: { label: 'temperature', unit: '°C', min: 1, max: 200 },
  q: { label: 'liquid flow', unit: 'L/s', min: 0, max: 20 },
  x: { label: 'vapor fraction', unit: '-', min: 0, max: 1 },
};
const ICONS = Object.fromEntries(Object.entries(UNIT_TYPES).map(([k, v]) => [k, v.icon]));
const LOOP_COLORS = ['--cl-mv', '--cl-sp', '--cl-pv'];

function unitNames(units) {
  const counts = {};
  return Object.fromEntries(units.map((u) => {
    const spec = UNIT_TYPES[u.type];
    if (spec.fixed) return [u.id, spec.label];
    counts[u.type] = (counts[u.type] || 0) + 1;
    return [u.id, `${spec.label} ${counts[u.type]}`];
  }));
}

const measurementsOf = (units, names) => units.filter((u) => u.type !== 'sink').flatMap((u) => [
  ...(u.type === 'tank' ? ['level'] : []), 'T', 'q', ...(u.type === 'heater' || u.type === 'hx' ? ['x'] : []),
].map((k) => ({ key: `${u.id}.${k}`, kind: k, label: `${names[u.id]} · ${KINDS[k].label} [${KINDS[k].unit}]` })));

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export default function ProcessBuilder() {
  const [preset, setPreset] = useState(BUILDER_PRESETS[0]);
  const [units, setUnits] = useState(preset.units);
  const [loops, setLoops] = useState(preset.loops);
  const [watch, setWatch] = useState(preset.watch);
  const [tEnd, setTEnd] = useState(preset.tEnd);
  const [Tamb, setTamb] = useState(20);
  const [selected, setSelected] = useState(preset.units[1]?.id);
  const nextId = useRef(1);

  const choose = (p) => {
    setPreset(p); setUnits(p.units); setLoops(p.loops); setWatch(p.watch); setTEnd(p.tEnd); setSelected(p.units[1]?.id);
  };
  const names = unitNames(units);
  const meas = measurementsOf(units, names);
  const valid = (key) => meas.some((m) => m.key === key);
  const kindOf = (key) => KINDS[meas.find((m) => m.key === key)?.kind ?? 'T'];
  const mvUnits = units.filter((u) => UNIT_TYPES[u.type].mv);
  const liveLoops = loops.map((l) => ({ ...l, enabled: l.enabled && valid(l.pv) && mvUnits.some((u) => u.id === l.mv) }));
  const watchKey = valid(watch) ? watch : meas[0]?.key;

  const run = useMemo(
    () => simulateFlowsheet({ units, loops: liveLoops, env: { Tamb }, dt: 0.5, tEnd }),
    [units, JSON.stringify(liveLoops), Tamb, tEnd], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const s = run.series;
  const lastOf = (k) => (s[k] ? s[k][s[k].length - 1] : NaN);
  const outlet = units[units.length - 2];
  const watchLoop = liveLoops.findIndex((l) => l.enabled && l.pv === watchKey);

  const insertAt = () => {
    const i = units.findIndex((u) => u.id === selected);
    return i <= 0 || i >= units.length - 1 ? units.length - 1 : i + 1;
  };
  const add = (type) => {
    const unit = { id: `n${nextId.current++}`, type, params: defaultParams(type) };
    const at = insertAt();
    setUnits((us) => [...us.slice(0, at), unit, ...us.slice(at)]);
    setSelected(unit.id);
  };
  const addLoop = () => {
    const mv = mvUnits[0]?.id ?? null;
    setLoops((ls) => [...ls, { enabled: true, pv: watchKey, mv, sp: lastOf(watchKey) || 1, Kc: 0.05, tauI: 120, reverse: false }]);
    setSelected(`loop-${loops.length}`);
  };
  const selIdx = units.findIndex((u) => u.id === selected);
  const selUnit = units[selIdx];
  const loopIdx = selected?.startsWith('loop-') ? Number(selected.slice(5)) : -1;
  const movable = selUnit && !UNIT_TYPES[selUnit.type].fixed;
  const move = (dir) => setUnits((us) => {
    const j = selIdx + dir;
    if (j < 1 || j > us.length - 2) return us;
    const next = [...us];
    [next[selIdx], next[j]] = [next[j], next[selIdx]];
    return next;
  });
  const removeSel = () => { setUnits((us) => us.filter((u) => u.id !== selected)); setSelected(units[selIdx - 1]?.id); };
  const setParam = (k, v) => setUnits((us) => us.map((u) => (u.id === selected ? { ...u, params: { ...u.params, [k]: v } } : u)));

  const panels = [
    {
      title: meas.find((m) => m.key === watchKey)?.label ?? '',
      series: [
        ...(watchLoop >= 0 ? [{ data: s[`loop${watchLoop}.sp`], color: '--cl-sp', dash: [6, 4] }] : []),
        { data: s[watchKey], color: '--cl-pv' },
      ],
    },
    liveLoops.some((l) => l.enabled)
      ? { title: 'PID outputs [%]', series: liveLoops.map((l, k) => ({ data: s[`loop${k}.u`], color: LOOP_COLORS[k % 3] })) }
      : { title: `${names[outlet.id]} · temperature [°C]`, series: [{ data: s[`${outlet.id}.T`], color: '--cl-mv' }] },
  ];

  return (
    <>
      <p className="cl-lede">Build a process from blocks, pick fluids and materials, and see where the energy goes. Add PID blocks to close loops around any variable.</p>
      <div className="cl-presets" role="group" aria-label="Scenarios">
        {BUILDER_PRESETS.map((p) => (
          <button key={p.id} type="button" className={`cl-chip${p.id === preset.id ? ' is-active' : ''}`} aria-pressed={p.id === preset.id} onClick={() => choose(p)}>{p.label}</button>
        ))}
      </div>
      <p className="cl-note">{preset.note}</p>

      <BlockDiagram units={units} names={names} icons={ICONS} loops={liveLoops} streams={run.streams} selected={selected} onSelect={setSelected} />
      <div className="pb-toolbar" role="group" aria-label="Edit diagram">
        <span className="pb-toolbar-label">Add after selected:</span>
        {ADDABLE.map((t) => <button key={t} type="button" className="cl-chip" onClick={() => add(t)}>{UNIT_TYPES[t].icon} {UNIT_TYPES[t].label}</button>)}
        <button type="button" className="cl-chip" onClick={addLoop}>PID loop</button>
        <span className="pb-toolbar-sep" />
        <button type="button" className="cl-chip" disabled={!movable || selIdx <= 1} onClick={() => move(-1)} aria-label="Move selected block left">←</button>
        <button type="button" className="cl-chip" disabled={!movable || selIdx >= units.length - 2} onClick={() => move(1)} aria-label="Move selected block right">→</button>
        <button type="button" className="cl-chip" disabled={!movable} onClick={removeSel}>Remove</button>
      </div>

      <div className="cl-grid">
        <section className="cl-figure" aria-label="Response plot">
          <label className="cl-param-label" htmlFor="pb-watch">Plot</label>
          <select id="pb-watch" className="cl-select" value={watchKey} onChange={(e) => setWatch(e.target.value)}>
            {meas.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <LoopPlot t={s.t} panels={panels} summary={`${panels[0].title}: final ${fmt(lastOf(watchKey))}`} />
          <dl className="cl-readouts">
            <div><dt>Outlet T</dt><dd>{fmt(lastOf(`${outlet.id}.T`), 1)} °C</dd></div>
            <div><dt>Outlet liquid flow</dt><dd>{fmt(lastOf(`${outlet.id}.q`))} L/s</dd></div>
            <div><dt>Wall heat loss</dt><dd>{fmt(run.balance.losses / 1000, 1)} kW</dd></div>
            <div><dt>Heat added</dt><dd>{fmt(run.balance.added / 1000, 1)} kW</dd></div>
          </dl>
        </section>

        <section className="cl-controls" aria-label="Selected block settings">
          {selUnit && <UnitInspector unit={selUnit} name={names[selUnit.id]} controlled={liveLoops.some((l) => l.enabled && l.mv === selUnit.id)} onParam={setParam} />}
          {loopIdx >= 0 && loops[loopIdx] && (
            <LoopInspector
              loop={loops[loopIdx]}
              index={loopIdx}
              measurements={meas}
              mvUnits={mvUnits}
              names={names}
              kindOf={kindOf}
              onChange={(l) => setLoops((ls) => ls.map((x, k) => (k === loopIdx ? l : x)))}
              onRemove={() => { setLoops((ls) => ls.filter((_, k) => k !== loopIdx)); setSelected(units[1]?.id); }}
            />
          )}
          {!selUnit && loopIdx < 0 && <p className="pb-empty">Select a block in the diagram to edit it.</p>}
          <h2>Environment</h2>
          <ParamSlider id="pb-tamb" label="Ambient temperature" unit="°C" value={Tamb} min={-20} max={45} onChange={setTamb} />
          <ParamSlider id="pb-tend" label="Simulated time" unit="s" value={tEnd} min={60} max={7200} log onChange={setTEnd} />
          <button type="button" className="cl-reset" onClick={() => choose(preset)}>Reset scenario</button>
        </section>
      </div>

      <StreamTable units={units} names={names} streams={run.streams} duties={run.duties} balance={run.balance} />

      <details className="cl-details">
        <summary>Equations, data and limits</summary>
        <p><strong>Phase change (1 atm):</strong> h = cp·T + x·h_vap, liquid reference 0 °C. Boiling point from Antoine, log10(P/bar) = A − B/(T + C).</p>
        <p><strong>Walls:</strong> 1/U = 1/h_in + t_wall/k_wall + t_ins/k_ins + 1/h_out (series resistances, thin wall). Heat loss = U·A·(T − T_amb).</p>
        <p><strong>Pipe:</strong> 10 well-mixed cells in series, which gives transport delay and heat loss along the length.</p>
        <p><strong>Tank:</strong> Torricelli outflow q = Cd·a·√(2gh), Cd = 0.65; M·cp·dT/dt = ṁ_in·cp·(T_in − T) − UA·(T − T_amb). Vapor entering an open tank is vented.</p>
        <p><strong>Heat exchanger:</strong> counterflow ε-NTU against utility water.</p>
        <p><strong>Data:</strong> fluids from the NIST Chemistry WebBook and Wikipedia data pages; wall k from the Wikipedia list of thermal conductivities; h values picked inside Engineering Toolbox ranges.</p>
        <p><strong>Limits:</strong> constant properties at 25 °C, 1 atm, series flow only (no recycle), no superheated vapor, no boiling inside tanks or pipes.</p>
      </details>
    </>
  );
}
