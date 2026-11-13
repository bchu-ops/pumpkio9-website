import React, { useEffect, useRef, useState } from 'react';

const LIMIT = 1e3; // keep unstable runs drawable

function niceStep(span, target) {
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function niceRange(values) {
  let lo = Infinity;
  let hi = -Infinity;
  values.forEach((arr) => arr.forEach((v) => {
    if (v === null) return;
    const c = Math.max(-LIMIT, Math.min(LIMIT, v));
    if (c < lo) lo = c;
    if (c > hi) hi = c;
  }));
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  const step = niceStep(hi - lo, 4);
  return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step };
}

const label = (v, step) => (step >= 1 ? v.toFixed(0) : v.toFixed(Math.min(3, -Math.floor(Math.log10(step)))));

function drawPanel(ctx, { x0, y0, w, h, t, series, title, colors, xTicks }) {
  const { lo, hi, step } = niceRange(series.map((s) => s.data));
  const tMax = t[t.length - 1];
  const X = (v) => x0 + (v / tMax) * w;
  const Y = (v) => y0 + h - ((Math.max(-LIMIT, Math.min(LIMIT, v)) - lo) / (hi - lo)) * h;

  ctx.font = '11px -apple-system, Segoe UI, sans-serif';
  ctx.lineWidth = 1;
  ctx.textBaseline = 'middle';
  for (let v = lo; v <= hi + step / 2; v += step) {
    const y = Y(v);
    ctx.strokeStyle = colors.grid;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.textAlign = 'right';
    ctx.fillText(label(v, step), x0 - 6, y);
  }
  if (xTicks) {
    const xs = niceStep(tMax, 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= tMax + 1e-9; v += xs) ctx.fillText(label(v, xs), X(v), y0 + h + 6);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = colors.text;
  ctx.font = '600 12px -apple-system, Segoe UI, sans-serif';
  ctx.fillText(title, x0, y0 - 6);

  series.forEach(({ data, color, dash }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    data.forEach((v, i) => (i ? ctx.lineTo(X(t[i]), Y(v)) : ctx.moveTo(X(t[i]), Y(v))));
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

/**
 * Stacked time-series panels on one canvas.
 * panels: [{ title, series: [{ data, color: '--css-var', dash }] }]; last panel gets time ticks.
 */
export default function LoopPlot({ t, panels, summary }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const css = getComputedStyle(canvas);
    const v = (name) => css.getPropertyValue(name).trim();
    const colors = { grid: v('--cl-grid'), muted: v('--cl-muted'), text: v('--cl-text') };
    const left = 44;
    const w = width - left - 12;
    const head = 22;
    const usable = height - (panels.length + 1) * head - 18;
    const weights = panels.map((_, i) => (i === 0 && panels.length > 1 ? 1.6 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let y = head;
    panels.forEach((panel, i) => {
      const h = (usable * weights[i]) / total;
      drawPanel(ctx, {
        x0: left, y0: y, w, h, t, title: panel.title, colors, xTicks: i === panels.length - 1,
        series: panel.series
          .filter((s) => s.data && s.data.some((d) => d !== null))
          .map((s) => ({ ...s, color: v(s.color) })),
      });
      y += h + head;
    });
    ctx.fillStyle = colors.muted;
    ctx.font = '11px -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('time [s]', width - 12, height - 2);
  }, [t, panels, width]);

  return (
    <div ref={wrapRef} className="cl-plot">
      <canvas ref={canvasRef} role="img" aria-label={summary} />
    </div>
  );
}
