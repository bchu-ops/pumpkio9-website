import React, { useRef } from 'react';

const VIEW_W = 1000;
const PAD = { top: 8, bottom: 8 };

/**
 * One telemetry channel plotted against lap distance. Several charts share
 * `hoverIndex` so moving over any of them moves the crosshair on all.
 * series: [{ key, values, color, dashed? }]; `step` draws stair lines (gear, brake).
 */
export default function TraceChart({
  title, unit, series, height = 120, min, max, step = false, zeroLine = false,
  hoverIndex, onHover, format = (v) => Math.round(v),
}) {
  const svgRef = useRef(null);
  const n = series[0]?.values.length || 0;
  const all = series.flatMap((s) => s.values);
  const lo = min ?? Math.min(...all);
  const hi = max ?? Math.max(...all);
  const span = hi - lo || 1;
  const x = (i) => (i / Math.max(1, n - 1)) * VIEW_W;
  const y = (v) => PAD.top + (1 - (v - lo) / span) * (height - PAD.top - PAD.bottom);

  const path = (values) => values.map((v, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return step && i > 0 ? `H${x(i).toFixed(1)}V${y(v).toFixed(1)}` : `${cmd}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  }).join('');

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onHover(Math.round(f * (n - 1)));
  };

  return (
    <figure className="sd-chart">
      <figcaption className="sd-chart__head">
        <span className="sd-chart__title">{title}</span>
        {hoverIndex != null && (
          <span className="sd-chart__values">
            {series.map((s) => (
              <span key={s.key} style={{ color: s.color }}>
                {s.key} {format(s.values[hoverIndex])}{unit}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <svg
        ref={svgRef}
        className="sd-chart__svg"
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => onHover(null)}
        role="img"
        aria-label={`${title} by lap distance`}
      >
        {zeroLine && lo < 0 && hi > 0 && (
          <line className="sd-chart__zero" x1="0" x2={VIEW_W} y1={y(0)} y2={y(0)} />
        )}
        {series.map((s) => (
          <path
            key={s.key}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.6"
            strokeDasharray={s.dashed ? '6 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {hoverIndex != null && (
          <line className="sd-chart__cursor" x1={x(hoverIndex)} x2={x(hoverIndex)} y1="0" y2={height} />
        )}
      </svg>
    </figure>
  );
}
