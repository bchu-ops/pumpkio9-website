import React, { useMemo, useRef, useState } from 'react';
import LoopPlot from './LoopPlot';
import ParamSlider from './ParamSlider';
import BlockDiagram, { MiniSymbol, blockAt, slotAt } from './BlockDiagram';
import Palette from './Palette';
import useDrag from './useDrag';
import { insertUnit, loopFor, moveUnit, removeUnit } from './lib/editFlowsheet';
import { LoopInspector, UnitInspector } from './Inspector';
import StreamTable from './StreamTable';
import { BUILDER_PRESETS } from './lib/thermoPresets';
import { simulateFlowsheet } from './lib/flowsheet';
import { UNIT_TYPES, defaultParams } from './lib/units';

const ADDABLE = ['valve', 'heater', 'hx', 'pipe', 'tank'];
const KINDS = {
  level: { label: 'level', unit: 'm', min: 0, max: 10 },
  T: { label: 'temperature', unit: '°C', min: 1, max: 200 },
  q: { label: 'liquid flow', unit: 'L/s', min: 0, max: 20 },
  x: { label: 'vapor fraction', unit: '-', min: 0, max: 1 },
};
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

export default function ThermoBuilder() {
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

  const selIdx = units.findIndex((u) => u.id === selected);
  const selUnit = units[selIdx];
  const loopIdx = selected?.startsWith('loop-') ? Number(selected.slice(5)) : -1;

  // --- Editing: drag from the palette, drag blocks to reorder, drop on the palette to remove ---
  const svgRef = useRef(null);
  const paletteRef = useRef(null);
  const afterSelected = () => (selIdx <= 0 || selIdx >= units.length - 1 ? units.length - 1 : selIdx + 1);
  const pidTarget = () => (selUnit && selUnit.type !== 'sink' ? selUnit.id : outlet.id);
  const addUnit = (type, slot) => {
    const unit = { id: `n${nextId.current++}`, type, params: defaultParams(type) };
    setUnits((us) => insertUnit(us, unit, slot));
    setSelected(unit.id);
  };
  const addLoopOn = (pvId) => {
    setLoops((ls) => [...ls, loopFor(units, pvId, lastOf(`${pvId}.T`) || 1)]);
    setSelected(`loop-${loops.length}`);
  };
  const removeId = (id) => {
    const i = units.findIndex((u) => u.id === id);
    const out = removeUnit(units, loops, id);
    setUnits(out.units);
    setLoops(out.loops);
    setSelected(units[i - 1]?.id);
  };
  const moveBy = (id, dir) => {
    const i = units.findIndex((u) => u.id === id);
    setUnits((us) => moveUnit(us, id, dir < 0 ? i - 1 : i + 2));
  };
  const within = (el, x, y, pad = 0) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };
  const locate = (x, y) => {
    if (within(paletteRef.current, x, y)) return { zone: 'palette' };
    const svg = svgRef.current;
    if (!svg || !within(svg.parentNode, x, y, 24)) return { zone: null };
    const sx = x - svg.getBoundingClientRect().left;
    return { zone: 'diagram', slot: slotAt(units.length, sx), block: Math.min(blockAt(units.length, sx), units.length - 2) };
  };
  const hintFor = (payload, x, y) => {
    const at = locate(x, y);
    if (at.zone !== 'diagram') return null;
    return payload.kind === 'pid' ? { target: units[at.block].id } : { slot: at.slot };
  };
  const { drag, start } = useDrag({
    onTap: (p) => {
      if (p.kind === 'add') addUnit(p.type, afterSelected());
      if (p.kind === 'pid') addLoopOn(pidTarget());
    },
    onDrop: (p, x, y) => {
      const at = locate(x, y);
      if (p.kind === 'move') {
        if (at.zone === 'palette') removeId(p.id);
        if (at.zone === 'diagram') setUnits((us) => moveUnit(us, p.id, at.slot));
      } else if (at.zone === 'diagram') {
        if (p.kind === 'pid') addLoopOn(units[at.block].id);
        else addUnit(p.type, at.slot);
      }
    },
  });
  const hint = drag ? hintFor(drag.payload, drag.x, drag.y) : null;
  const setParam = (k, v) => setUnits((us) => us.map((u) => (u.id === selected ? { ...u, params: { ...u.params, [k]: v } } : u)));

  const panels = [
    {
      title: meas.find((m) => m.key === watchKey)?.label ?? '',
      series: [
        ...(watchLoop >= 0 ? [{ data: s[`loop${watchLoop}.sp`], color: '--cl-sp', dash: [6, 4], width: 1.25 }] : []),
        { data: s[watchKey], color: '--cl-pv', width: 2 },
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

      <div className={drag ? 'pb-editing is-dragging' : 'pb-editing'}>
        <Palette
          ref={paletteRef}
          types={ADDABLE}
          removing={drag?.payload.kind === 'move'}
          armed={drag?.payload.kind === 'move' && within(paletteRef.current, drag.x, drag.y)}
          onStart={start}
          onAdd={(p) => (p.kind === 'pid' ? addLoopOn(pidTarget()) : addUnit(p.type, afterSelected()))}
        />
        <p className="pb-hint">Drag equipment onto the line, or tap it to add after the selected block. Drag a block along the line to reorder it, or back to the palette to remove it. Drop a PID loop on the block it should measure.</p>
        <BlockDiagram
          units={units} names={names} loops={liveLoops} streams={run.streams} selected={selected} onSelect={setSelected}
          svgRef={svgRef} hint={hint} draggingId={drag?.payload.kind === 'move' ? drag.payload.id : null}
          onBlockDown={(u) => start({ kind: 'move', id: u.id, type: u.type })} onRemove={removeId} onMove={moveBy}
        />
        {drag && (
          <div className="pb-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><MiniSymbol type={drag.payload.type} /></div>
        )}
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
          {selUnit && <UnitInspector unit={selUnit} name={names[selUnit.id]} controlled={liveLoops.some((l) => l.enabled && l.mv === selUnit.id)} onParam={setParam} onRemove={UNIT_TYPES[selUnit.type].fixed ? null : () => removeId(selUnit.id)} />}
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
