import React from 'react';

const STEPS = 1000;
const toPos = (v, min, max, log) => (log
  ? (Math.log(v / min) / Math.log(max / min)) * STEPS
  : ((v - min) / (max - min)) * STEPS);
const fromPos = (p, min, max, log) => (log
  ? min * (max / min) ** (p / STEPS)
  : min + ((max - min) * p) / STEPS);
const round = (v) => Number(v.toPrecision(3));

/** Range slider paired with a number box. Log scale for gains and time constants. */
export default function ParamSlider({ id, label, unit, value, min, max, log = false, disabled = false, onChange }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="cl-param">
      <label htmlFor={id} className="cl-param-label">
        {label}{unit && <span className="cl-unit"> [{unit}]</span>}
      </label>
      <div className="cl-param-row">
        <input
          id={id}
          type="range"
          min={0}
          max={STEPS}
          value={Math.round(toPos(value, min, max, log))}
          aria-valuetext={`${round(value)} ${unit || ''}`}
          disabled={disabled}
          onChange={(e) => onChange(round(fromPos(Number(e.target.value), min, max, log)))}
        />
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${label} value`}
          value={round(value)}
          step="any"
          disabled={disabled}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && e.target.value !== '') onChange(clamp(v));
          }}
        />
      </div>
    </div>
  );
}
