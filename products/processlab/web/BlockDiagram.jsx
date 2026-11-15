import React from 'react';

const W = 116; // block width
const H = 60; // block height
const GAP = 48; // arrow length between blocks
const PAD = 12;
const TOP = 26; // room for stream labels
const SY = TOP + 24; // centre line of symbols and process lines
const LOOP_ROW = 50; // vertical space per control loop
const R = 18; // instrument bubble radius

const xOf = (i) => PAD + i * (W + GAP);
const cx = (i) => xOf(i) + W / 2;

/** Half-width of each symbol, so process lines stop at the drawing, not the hit box. */
const HALF = { source: 22, sink: 22, valve: 16, heater: 22, hx: 22, pipe: 26, tank: 15 };

/** Distance from the centre line to the bottom of each symbol, where signal lines attach. */
const BOTTOM = { valve: 10, tank: 17, hx: 14, pipe: 6 };
const bottomOf = (u) => SY + (BOTTOM[u.type] ?? 12);

/** Gap index under svg x: 1 = right after the source, n - 1 = just before the sink. */
export function slotAt(n, x) {
  let slot = 0;
  for (let i = 0; i < n; i += 1) if (cx(i) < x) slot = i + 1;
  return Math.max(1, Math.min(n - 1, slot));
}

/** Index of the block nearest svg x. */
export const blockAt = (n, x) => Math.max(0, Math.min(n - 1, Math.round((x - PAD - W / 2) / (W + GAP))));

/** Label for the stream leaving block i, e.g. "62 °C" or "100 °C · 12% vap". */
function streamLabel(s) {
  if (!s) return '';
  const T = `${s.T.toFixed(0)} °C`;
  return s.x > 0.0005 ? `${T} · ${(s.x * 100).toFixed(0)}% vap` : T;
}

/** P&ID-style outline symbol for a unit type, centred on (x, SY). */
function Symbol({ type, x }) {
  const y = SY;
  switch (type) {
    case 'source':
    case 'sink': // off-sheet connector
      return <path className="bd-sym" d={`M${x - 20},${y - 10} H${x + 10} L${x + 20},${y} L${x + 10},${y + 10} H${x - 20} Z`} />;
    case 'valve': // globe valve with diaphragm actuator
      return (
        <g className="bd-sym">
          <path d={`M${x - 16},${y - 9} L${x + 16},${y + 9} V${y - 9} L${x - 16},${y + 9} Z`} />
          <path d={`M${x},${y} V${y - 16} M${x - 9},${y - 16} A9,7 0 0 1 ${x + 9},${y - 16} Z`} />
        </g>
      );
    case 'heater': // electric heater: element coil in a box
      return (
        <g className="bd-sym">
          <rect x={x - 22} y={y - 12} width={44} height={24} />
          <path d={`M${x - 16},${y} l4,-6 l6,12 l6,-12 l6,12 l6,-12 l4,6`} />
        </g>
      );
    case 'hx': // shell-and-tube exchanger
      return (
        <g className="bd-sym">
          <circle cx={x} cy={y} r={14} />
          <path d={`M${x - 22},${y} H${x - 10} l4,-7 l6,14 l6,-14 l4,7 H${x + 22}`} />
        </g>
      );
    case 'pipe': // insulated line: double wall with lagging hatch
      return (
        <g className="bd-sym">
          <path d={`M${x - 26},${y - 5} H${x + 26} M${x - 26},${y + 5} H${x + 26}`} />
          <path className="bd-hatch" d={Array.from({ length: 9 }, (_, k) => `M${x - 24 + k * 6},${y + 5} l4,-10`).join(' ')} />
        </g>
      );
    case 'tank': // open-top vessel with liquid level
      return (
        <g className="bd-sym">
          <path d={`M${x - 15},${y - 16} V${y + 10} A15,6 0 0 0 ${x + 15},${y + 10} V${y - 16}`} />
          <path className="bd-level" d={`M${x - 15},${y} H${x + 15}`} />
        </g>
      );
    default:
      return <rect className="bd-sym" x={x - 18} y={y - 12} width={36} height={24} />;
  }
}

/** Small standalone symbol for the palette and the drag preview. */
export function MiniSymbol({ type }) {
  return (
    <svg className="bd-mini" viewBox={`0 ${SY - 22} 60 44`} width="60" height="44" aria-hidden="true">
      {type === 'pid' ? (
        <g>
          <circle className="bd-bubble" cx={30} cy={SY} r={R} />
          <text className="bd-tag" x={30} y={SY + 4} textAnchor="middle">PID</text>
        </g>
      ) : <Symbol type={type} x={30} />}
    </svg>
  );
}

/**
 * Series flowsheet drawn with P&ID conventions: outline equipment symbols,
 * solid process lines, dashed electrical signal lines and one ISA circle
 * per PID loop (PV from the measured block, MV to the manipulated block).
 */
export default function BlockDiagram({ units, names, loops, streams, selected, onSelect, svgRef, hint, draggingId, onBlockDown, onRemove, onMove }) {
  const idx = Object.fromEntries(units.map((u, i) => [u.id, i]));
  const width = PAD * 2 + units.length * W + (units.length - 1) * GAP;
  const height = TOP + H + 14 + loops.length * LOOP_ROW;
  const key = (id, movable) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
    if (!movable) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onRemove?.(id); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onMove?.(id, e.key === 'ArrowLeft' ? -1 : 1); }
  };
  const half = (u) => HALF[u.type] ?? 18;

  return (
    <div className="bd-wrap">
      <svg ref={svgRef} className={`bd${hint ? ' is-dragging' : ''}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Process flow diagram">
        <defs>
          <marker id="bd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" className="bd-arrowhead" />
          </marker>
        </defs>

        {units.slice(0, -1).map((u, i) => (
          <g key={`s-${u.id}`}>
            <line className="bd-stream" x1={cx(i) + half(u)} y1={SY} x2={cx(i + 1) - half(units[i + 1]) - 1} y2={SY} markerEnd="url(#bd-arrow)" />
            <text className="bd-stream-label" x={xOf(i) + W + GAP / 2} y={TOP - 6} textAnchor="middle">{streamLabel(streams[u.id])}</text>
          </g>
        ))}

        {loops.map((loop, k) => {
          const pvId = loop.pv?.split('.')[0];
          if (idx[pvId] === undefined || idx[loop.mv] === undefined) return null;
          const xPv = cx(idx[pvId]);
          const xMv = cx(idx[loop.mv]);
          const y = TOP + H + 10 + k * LOOP_ROW + R;
          const xB = (xPv + xMv) / 2;
          const rightToLeft = xPv > xMv;
          const id = `loop-${k}`;
          return (
            <g key={id} className={`bd-loop${selected === id ? ' is-selected' : ''}${loop.enabled ? '' : ' is-off'}`}>
              <path className="bd-signal" d={`M${xPv},${bottomOf(units[idx[pvId]])} V${y} H${rightToLeft ? xB + R : xB - R}`} markerEnd="url(#bd-arrow)" />
              <path className="bd-signal" d={`M${rightToLeft ? xB - R : xB + R},${y} H${xMv} V${bottomOf(units[idx[loop.mv]]) + 2}`} markerEnd="url(#bd-arrow)" />
              <g role="button" tabIndex={0} aria-label={`PID loop ${k + 1}${selected === id ? ', selected' : ''}`} aria-pressed={selected === id} onClick={() => onSelect(id)} onKeyDown={key(id)}>
                <circle className="bd-bubble" cx={xB} cy={y} r={R} />
                <text className="bd-tag" x={xB} y={y - 2} textAnchor="middle">PID</text>
                <text className="bd-tag" x={xB} y={y + 11} textAnchor="middle">{k + 1}{loop.enabled ? '' : ' off'}</text>
              </g>
            </g>
          );
        })}

        {units.map((u, i) => {
          const fixed = u.type === 'source' || u.type === 'sink';
          const cls = [
            'bd-block',
            fixed ? '' : 'is-movable',
            selected === u.id ? 'is-selected' : '',
            draggingId === u.id ? 'is-lifted' : '',
            hint?.target === u.id ? 'is-target' : '',
          ].filter(Boolean).join(' ');
          return (
          <g
            key={u.id}
            role="button"
            tabIndex={0}
            aria-label={`${names[u.id]}${selected === u.id ? ', selected' : ''}${fixed ? '' : '. Arrow keys move it, Delete removes it'}`}
            aria-pressed={selected === u.id}
            className={cls}
            onClick={() => onSelect(u.id)}
            onKeyDown={key(u.id, !fixed)}
            onPointerDown={fixed ? undefined : onBlockDown?.(u)}
          >
            <rect className="bd-hit" x={xOf(i)} y={TOP - 2} width={W} height={H} />
            <Symbol type={u.type} x={cx(i)} />
            <text className="bd-name" x={cx(i)} y={TOP + H - 8} textAnchor="middle">{names[u.id]}</text>
          </g>
          );
        })}

        {hint?.slot !== undefined && (
          <g className="bd-drop" aria-hidden="true">
            <line x1={xOf(hint.slot) - GAP / 2} x2={xOf(hint.slot) - GAP / 2} y1={TOP - 4} y2={TOP + H - 4} />
            <circle cx={xOf(hint.slot) - GAP / 2} cy={SY} r={5} />
          </g>
        )}
      </svg>
    </div>
  );
}
