import React, { useMemo } from 'react';

const SIZE = 500;
const MARGIN = 24;

/**
 * Racing line from driver A's lap, coloured by who was quicker in each
 * mini-sector. Dots show both cars at the hovered point of the lap.
 */
export default function TrackMap({ cmp, cmpC = null, sectors, corners = [], colors, names, hoverIndex }) {
  const { points, toView } = useMemo(() => {
    const pts = cmp.a.map((p) => ({ x: p.x, y: p.y }));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const scale = (SIZE - 2 * MARGIN) / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY, 1);
    const offX = (SIZE - (Math.max(...xs) - minX) * scale) / 2;
    const offY = (SIZE - (Math.max(...ys) - minY) * scale) / 2;
    // OpenF1 y grows upward; SVG y grows downward.
    const view = (p) => ({ x: offX + (p.x - minX) * scale, y: SIZE - (offY + (p.y - minY) * scale) });
    return { points: pts.map(view), toView: view };
  }, [cmp]);

  const segment = (from, to) => points.slice(from, to + 1).map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
  const dot = (grid) => (hoverIndex == null || grid[hoverIndex].x == null ? null : toView(grid[hoverIndex]));
  const dotA = dot(cmp.a);
  const dotB = dot(cmp.b);
  const dotC = cmpC ? dot(cmpC.b) : null;
  const sides = Object.keys(names).filter((k) => names[k]);
  const won = Object.fromEntries(sides.map((k) => [k, sectors.filter((s) => s.winner === k).length]));

  return (
    <figure className="sd-map">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Track map, quickest driver per mini-sector: ${sides.map((k) => `${names[k]} ${won[k]}`).join(', ')} of ${sectors.length}`}>
        <path className="sd-map__base" d={segment(0, points.length - 1)} />
        {sectors.map((s) => (
          <path key={s.from} d={segment(s.from, s.to)} stroke={colors[s.winner]} className="sd-map__sector" />
        ))}
        {corners.map((c) => {
          const p = points[c.apexIndex];
          return (
            <g key={c.n} className="sd-map__corner">
              <circle cx={p.x} cy={p.y} r="3" />
              <text x={p.x + 8} y={p.y - 8}>C{c.n}</text>
            </g>
          );
        })}
        <circle className="sd-map__start" cx={points[0].x} cy={points[0].y} r="6" />
        {dotC && <circle cx={dotC.x} cy={dotC.y} r="8" fill={colors.c} className="sd-map__car" />}
        {dotB && <circle cx={dotB.x} cy={dotB.y} r="8" fill={colors.b} className="sd-map__car" />}
        {dotA && <circle cx={dotA.x} cy={dotA.y} r="8" fill={colors.a} className="sd-map__car" />}
      </svg>
      <figcaption className="sd-map__legend">
        {sides.map((k) => (
          <span key={k}><i style={{ background: colors[k] }} />{names[k]} quickest ({won[k]})</span>
        ))}
        <span><i className="sd-map__legend-start" />Start / finish</span>
      </figcaption>
    </figure>
  );
}
