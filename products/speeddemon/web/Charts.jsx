import React, { useState } from 'react';
import TraceChart from './TraceChart';

const signed = (v) => (v >= 0 ? '+' : '') + v.toFixed(3);

/**
 * Stacked telemetry charts. On phones a tab bar shows one chart at a time
 * (CSS hides the others); on wider screens all charts stack and the tabs hide.
 */
export default function Charts({ cmp, cmpC, names, colors, hover, onHover }) {
  const [tab, setTab] = useState('speed');
  const drivers = [
    { key: names.a, grid: cmp.a, color: colors.a },
    { key: names.b, grid: cmp.b, color: colors.b, dashed: true },
    ...(cmpC ? [{ key: names.c, grid: cmpC.b, color: colors.c, dashed: true }] : []),
  ];
  const series = (channel) => drivers.map((d) => ({ key: d.key, values: d.grid.map((p) => p[channel]), color: d.color, dashed: d.dashed }));
  const gaps = [
    { key: names.b, values: cmp.delta, color: colors.b },
    ...(cmpC ? [{ key: names.c, values: cmpC.delta, color: colors.c }] : []),
  ];

  const charts = [
    { id: 'gap', tab: 'Gap', props: { title: `Gap to ${names.a}`, unit: 's', zeroLine: true, height: 110, series: gaps, format: signed } },
    { id: 'speed', tab: 'Speed', props: { title: 'Speed', unit: ' km/h', height: 150, min: 0, series: series('speed') } },
    { id: 'throttle', tab: 'Throttle', props: { title: 'Throttle', unit: '%', height: 80, min: 0, max: 100, series: series('throttle') } },
    { id: 'brake', tab: 'Brake', props: { title: 'Brake', unit: '', height: 50, min: 0, max: 100, step: true, series: series('brake'), format: (v) => (v > 0 ? 'on' : 'off') } },
    { id: 'gear', tab: 'Gear', props: { title: 'Gear', unit: '', height: 80, min: 1, max: 8, step: true, series: series('gear') } },
  ];

  return (
    <div className="sd-charts" data-tab={tab}>
      <div className="sd-tabs" role="tablist" aria-label="Chart">
        {charts.map((c) => (
          <button
            key={c.id} type="button" role="tab" aria-selected={tab === c.id}
            className={`sd-tabs__tab${tab === c.id ? ' is-active' : ''}`}
            onClick={() => setTab(c.id)}
          >
            {c.tab}
          </button>
        ))}
      </div>
      {charts.map((c) => (
        <div key={c.id} className="sd-charts__item" data-chart={c.id}>
          <TraceChart {...c.props} hoverIndex={hover} onHover={onHover} />
        </div>
      ))}
      <p className="sd-axis">
        {hover == null
          ? `Lap distance 0 – ${Math.round(cmp.length)} m · hover or tap a chart to scrub the lap`
          : `${Math.round(cmp.distance[hover])} m into the lap`}
      </p>
    </div>
  );
}
