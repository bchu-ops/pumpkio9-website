// Render part of the page (its panels, text and SVG charts) to a PNG in the
// browser. No server, no library: SVGs are drawn via <img>, text via canvas.

const SVG_STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-family', 'font-weight'];
const SCALE = 2;
const HEADER_H = 56;
const PAD = 20;

/** Copy computed styles onto a cloned SVG so it renders the same outside the page. */
export function inlineSvg(svg) {
  const clone = svg.cloneNode(true);
  const src = [svg, ...svg.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const cs = window.getComputedStyle(el);
    const style = SVG_STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    dst[i].setAttribute('style', `${dst[i].getAttribute('style') || ''};${style}`);
  });
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
}

const loadSvg = (markup) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Could not draw chart'));
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
});

const visible = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/** Draw `root` (panels, captions, SVGs) under a title bar onto a canvas. */
export async function renderToCanvas(root, title) {
  const box = root.getBoundingClientRect();
  const page = window.getComputedStyle(root.closest('.sd') || document.body);
  const bg = page.getPropertyValue('--sd-bg').trim() || '#ffffff';
  const fg = page.getPropertyValue('--sd-text').trim() || '#37352f';
  const muted = page.getPropertyValue('--sd-muted').trim() || '#787774';
  const font = page.getPropertyValue('font-family') || 'sans-serif';

  const canvas = document.createElement('canvas');
  canvas.width = (box.width + PAD * 2) * SCALE;
  canvas.height = (box.height + HEADER_H + PAD) * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = fg;
  ctx.font = `700 18px ${font}`;
  ctx.fillText(title, PAD, 30);
  ctx.fillStyle = muted;
  ctx.font = `13px ${font}`;
  ctx.fillText('Speed Demon · bchu-ops.github.io/pumpkio9-website/speed-demon · data: OpenF1', PAD, 48);

  const at = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left + PAD, y: r.top - box.top + HEADER_H, w: r.width, h: r.height };
  };

  root.querySelectorAll('.sd-map, .sd-chart').forEach((el) => {
    if (!visible(el)) return;
    const p = at(el);
    ctx.fillStyle = window.getComputedStyle(el).backgroundColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, 8);
    else ctx.rect(p.x, p.y, p.w, p.h);
    ctx.fill();
  });

  root.querySelectorAll('.sd-chart__head span, .sd-map__legend span, .sd-axis').forEach((el) => {
    if (!visible(el) || el.children.length > 1) return;
    const p = at(el);
    const cs = window.getComputedStyle(el);
    ctx.fillStyle = cs.color;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${font}`;
    ctx.fillText(el.textContent, p.x, p.y + parseFloat(cs.fontSize));
  });

  const svgs = [...root.querySelectorAll('svg')].filter(visible).filter((s) => !s.closest('button'));
  const images = await Promise.all(svgs.map((s) => loadSvg(inlineSvg(s))));
  images.forEach((img, i) => {
    const p = at(svgs[i]);
    ctx.drawImage(img, p.x, p.y, p.w, p.h);
  });
  return canvas;
}

/** Copy the PNG to the clipboard when the browser allows it, else download it. */
export async function shareCanvas(canvas, fileName) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not create image');
  if (navigator.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    } catch {
      // Clipboard blocked (permissions, Firefox): fall through to download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
