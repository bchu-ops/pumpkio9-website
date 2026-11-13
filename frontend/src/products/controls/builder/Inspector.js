import React from 'react';
import ParamSlider from '../ParamSlider';
import { UNIT_TYPES } from './units';

function Field({ id, spec, value, disabled, onChange }) {
  if (spec.options) {
    return (
      <div className="cl-param">
        <label className="cl-param-label" htmlFor={id}>{spec.label}</label>
        <select id={id} className="cl-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {Object.entries(spec.options).map(([k, name]) => <option key={k} value={k}>{name}</option>)}
        </select>
      </div>
    );
  }
  return <ParamSlider id={id} label={spec.label} unit={spec.unit} value={value} min={spec.min} max={spec.max} log={spec.log} disabled={disabled} onChange={onChange} />;
}

/** Settings for the selected unit block. */
export function UnitInspector({ unit, name, controlled, onParam }) {
  const spec = UNIT_TYPES[unit.type];
  return (
    <>
      <h2>{spec.icon} {name}</h2>
      {spec.params.length === 0 && <p className="pb-empty">Everything reaching the sink leaves the process.</p>}
      {spec.params.map((p) => (
        <Field key={p.key} id={`${unit.id}-${p.key}`} spec={p} value={unit.params[p.key] ?? p.def} disabled={controlled && spec.manual === p.key} onChange={(v) => onParam(p.key, v)} />
      ))}
      {controlled && <p className="pb-empty">Manual {spec.mv} is overridden by a PID loop.</p>}
    </>
  );
}

/** Settings for a PID loop block: what it measures, what it moves, tuning. */
export function LoopInspector({ loop, index, measurements, mvUnits, names, kindOf, onChange, onRemove }) {
  const set = (k) => (v) => onChange({ ...loop, [k]: v });
  const kind = kindOf(loop.pv);
  return (
    <>
      <h2>PID {index + 1}</h2>
      <label className="cl-check"><input type="checkbox" checked={loop.enabled} onChange={(e) => set('enabled')(e.target.checked)} /> Loop on</label>
      <label className="cl-param-label" htmlFor={`pv-${index}`}>Measures (PV)</label>
      <select id={`pv-${index}`} className="cl-select" value={loop.pv ?? ''} onChange={(e) => set('pv')(e.target.value)}>
        {measurements.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
      </select>
      <label className="cl-param-label" htmlFor={`mv-${index}`}>Moves (MV)</label>
      <select id={`mv-${index}`} className="cl-select" value={loop.mv ?? ''} onChange={(e) => set('mv')(e.target.value)}>
        <option value="">(choose a valve, heater or exchanger)</option>
        {mvUnits.map((u) => <option key={u.id} value={u.id}>{names[u.id]} ({UNIT_TYPES[u.type].mv})</option>)}
      </select>
      <ParamSlider id={`sp-${index}`} label="Setpoint" unit={kind.unit} value={Math.min(kind.max, Math.max(kind.min, loop.sp))} min={kind.min} max={kind.max} onChange={set('sp')} />
      <ParamSlider id={`kc-${index}`} label="Kc, gain" unit="1/unit" value={loop.Kc} min={0.001} max={20} log onChange={set('Kc')} />
      <ParamSlider id={`ti-${index}`} label="τI, integral time" unit="s" value={loop.tauI} min={1} max={1000} log onChange={set('tauI')} />
      <label className="cl-check"><input type="checkbox" checked={loop.reverse} onChange={(e) => set('reverse')(e.target.checked)} /> Reverse acting (more output lowers the PV)</label>
      <button type="button" className="cl-reset" onClick={onRemove}>Delete this loop</button>
    </>
  );
}
