import React from 'react';

const W = 116; // block width
const H = 56; // block height
const GAP = 48; // arrow length between blocks
const PAD = 12;
const TOP = 26; // room for stream labels
const LOOP_ROW = 46; // vertical space per control loop
const PID_W = 84;
const PID_H = 30;

const xOf = (i) => PAD + i * (W + GAP);
const cx = (i) => xOf(i) + W / 2;

/** Label for the stream leaving block i, e.g. "62 °C" or "100 °C · 12% vap". */
function streamLabel(s) {
  if (!s) return '';
  const T = `${s.T.toFixed(0)} °C`;
  return s.x > 0.0005 ? `${T} · ${(s.x * 100).toFixed(0)}% vap` : T;
}

/**
 * Series block diagram: process blocks left to right, streams on the arrows,
 * and one dashed feedback path per PID loop (PV from the measured block, MV to the manipulated block).
 */
export default function BlockDiagram({ units, names, icons, loops, streams, selected, onSelect }) {
  const idx = Object.fromEntries(units.map((u, i) => [u.id, i]));
  const width = PAD * 2 + units.length * W + (units.length - 1) * GAP;
  const height = TOP + H + 16 + loops.length * LOOP_ROW;
  const key = (id) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
  };

  return (
    <div className="bd-wrap">
      <svg className="bd" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Process block diagram">
        <defs>
          <marker id="bd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="bd-arrowhead" />
          </marker>
        </defs>

        {units.slice(0, -1).map((u, i) => (
          <g key={`s-${u.id}`}>
            <line className="bd-stream" x1={xOf(i) + W} y1={TOP + H / 2} x2={xOf(i + 1) - 2} y2={TOP + H / 2} markerEnd="url(#bd-arrow)" />
            <text className="bd-stream-label" x={xOf(i) + W + GAP / 2} y={TOP - 8} textAnchor="middle">{streamLabel(streams[u.id])}</text>
          </g>
        ))}

        {loops.map((loop, k) => {
          const pvId = loop.pv?.split('.')[0];
          if (idx[pvId] === undefined || idx[loop.mv] === undefined) return null;
          const xPv = cx(idx[pvId]);
          const xMv = cx(idx[loop.mv]);
          const y = TOP + H + 14 + k * LOOP_ROW + PID_H / 2;
          const xPid = (xPv + xMv) / 2 - PID_W / 2;
          const rightToLeft = xPv > xMv;
          const pidIn = rightToLeft ? xPid + PID_W : xPid;
          const pidOut = rightToLeft ? xPid : xPid + PID_W;
          const id = `loop-${k}`;
          return (
            <g key={id} className={`bd-loop${selected === id ? ' is-selected' : ''}`}>
              <path className="bd-signal" d={`M${xPv},${TOP + H} V${y} H${pidIn}`} markerEnd="url(#bd-arrow)" />
              <path className="bd-signal" d={`M${pidOut},${y} H${xMv} V${TOP + H + 2}`} markerEnd="url(#bd-arrow)" />
              <g role="button" tabIndex={0} aria-label={`PID loop ${k + 1}${selected === id ? ', selected' : ''}`} aria-pressed={selected === id} onClick={() => onSelect(id)} onKeyDown={key(id)}>
                <rect className="bd-pid" x={xPid} y={y - PID_H / 2} width={PID_W} height={PID_H} rx={6} />
                <text className="bd-pid-label" x={xPid + PID_W / 2} y={y + 4} textAnchor="middle">PID {k + 1}{loop.enabled ? '' : ' (off)'}</text>
              </g>
            </g>
          );
        })}

        {units.map((u, i) => (
          <g
            key={u.id}
            role="button"
            tabIndex={0}
            aria-label={`${names[u.id]}${selected === u.id ? ', selected' : ''}`}
            aria-pressed={selected === u.id}
            className={`bd-block${selected === u.id ? ' is-selected' : ''}`}
            onClick={() => onSelect(u.id)}
            onKeyDown={key(u.id)}
          >
            <rect x={xOf(i)} y={TOP} width={W} height={H} rx={8} />
            <text className="bd-icon" x={xOf(i) + W / 2} y={TOP + 24} textAnchor="middle">{icons[u.type]}</text>
            <text className="bd-name" x={xOf(i) + W / 2} y={TOP + 44} textAnchor="middle">{names[u.id]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
