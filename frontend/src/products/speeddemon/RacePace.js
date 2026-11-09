import React from 'react';
import { compoundColor, isRepresentativeLap, paceSummary } from './lib/race';
import { lapTime } from './lib/telemetry';

const W = 1000;
const CHART_H = 200;
const STINT_H = 14;
const PAD = { left: 52, right: 12, top: 10 };

/**
 * Lap times for both drivers across the session, with tyre stints and pit
 * stops underneath. Clicking (or Enter on) a lap selects it for the
 * telemetry comparison.
 */
export default function RacePace({ sides, selected, onSelectLap }) {
  const all = sides.flatMap((s) => s.laps);
  const reps = all.filter(isRepresentativeLap);
  if (reps.length < 4) return null;

  const maxLap = Math.max(...all.map((l) => l.lap));
  const lo = Math.min(...reps.map((l) => l.time)) - 0.3;
  const hi = Math.max(...reps.map((l) => l.time)) + 0.3;
  const x = (lap) => PAD.left + ((lap - 1) / Math.max(1, maxLap - 1)) * (W - PAD.left - PAD.right);
  const y = (t) => PAD.top + ((Math.min(t, hi) - lo) / (hi - lo)) * (CHART_H - PAD.top - 6);
  const ticks = [0, 0.5, 1].map((f) => lo + f * (hi - lo));
  const height = CHART_H + sides.length * (STINT_H + 6) + 22;

  const line = (laps) => laps.filter(isRepresentativeLap)
    .map((l, i) => `${i ? 'L' : 'M'}${x(l.lap).toFixed(1)},${y(l.time).toFixed(1)}`).join('');

  return (
    <section className="sd-race" aria-label="Race pace and tyres">
      <div className="sd-race__head">
        <h3>Session pace</h3>
        <div className="sd-race__pace">
          {sides.map((s) => {
            const p = paceSummary(s.laps);
            return (
              <span key={s.key} style={{ color: s.color }}>
                {s.name}: median {lapTime(p.median)} over {p.count} laps
              </span>
            );
          })}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} className="sd-race__svg" role="group" aria-label="Lap time per lap; select a lap to compare it">
        {ticks.map((t) => (
          <g key={t}>
            <line className="sd-race__grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="sd-race__label" x={PAD.left - 6} y={y(t) + 4} textAnchor="end">{lapTime(t)}</text>
          </g>
        ))}
        {sides.map((s) => (
          <path key={`line-${s.key}`} d={line(s.laps)} fill="none" stroke={s.color} strokeWidth="1.6" strokeDasharray={s.dashed ? '6 4' : undefined} />
        ))}
        {sides.map((s) => s.laps.map((l) => {
          const isSel = selected[s.key] === l.lap;
          const off = !isRepresentativeLap(l);
          return (
            <circle
              key={`${s.key}-${l.lap}`}
              cx={x(l.lap)}
              cy={y(l.time)}
              r={isSel ? 7 : 3.5}
              fill={off ? 'none' : s.color}
              stroke={s.color}
              strokeWidth={isSel ? 3 : 1.2}
              className={`sd-race__dot${isSel ? ' is-selected' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${s.name} lap ${l.lap}: ${lapTime(l.time)}${l.pitOut ? ', pit out' : ''}${l.slow ? ', slow lap' : ''}`}
              onClick={() => onSelectLap(s.key, l.lap)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectLap(s.key, l.lap); } }}
            >
              <title>{`${s.name} lap ${l.lap}: ${lapTime(l.time)}`}</title>
            </circle>
          );
        }))}
        {sides.map((s, row) => {
          const top = CHART_H + 6 + row * (STINT_H + 6);
          return (
            <g key={`stints-${s.key}`}>
              <text className="sd-race__label" x={PAD.left - 6} y={top + 11} textAnchor="end">{s.name}</text>
              {s.stints.map((st) => {
                const x0 = x(st.lap_start) - 3;
                const x1 = x(Math.min(st.lap_end ?? maxLap, maxLap)) + 3;
                return (
                  <g key={st.stint_number}>
                    <rect x={x0} y={top} width={Math.max(4, x1 - x0)} height={STINT_H} rx="3" fill={compoundColor(st.compound)} />
                    {x1 - x0 > 26 && (
                      <text className="sd-race__tyre" x={x0 + 6} y={top + 11}>{(st.compound || '?')[0]}</text>
                    )}
                  </g>
                );
              })}
              {s.pits.map((p) => (
                <line key={`pit-${p.lap_number}`} className="sd-race__pit" x1={x(p.lap_number)} x2={x(p.lap_number)} y1={top - 3} y2={top + STINT_H + 3} />
              ))}
            </g>
          );
        })}
        <text className="sd-race__label" x={W - PAD.right} y={height - 4} textAnchor="end">Lap {maxLap}</text>
        <text className="sd-race__label" x={PAD.left} y={height - 4}>Lap 1</text>
      </svg>
      <p className="sd-race__hint">Click a lap to compare it below. Hollow dots: pit-out, standing-start or slow laps (safety car, traffic). Bars: tyre stints (S/M/H/I/W), ticks: pit stops.</p>
    </section>
  );
}
