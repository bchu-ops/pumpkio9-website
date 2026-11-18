import { inlineSvg, shareCanvas } from './shareImage';

// renderToCanvas is not tested: it needs real layout (getBoundingClientRect, canvas 2D) that jsdom does not provide.

const NS = 'http://www.w3.org/2000/svg';

describe('inlineSvg', () => {
  const make = () => {
    const svg = document.createElementNS(NS, 'svg');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M0 0L1 1');
    path.setAttribute('style', 'color:red');
    svg.appendChild(path);
    document.body.appendChild(svg);
    return svg;
  };
  afterEach(() => { document.body.innerHTML = ''; });

  test('returns serialized SVG with the xmlns and explicit size', () => {
    const svg = make();
    svg.getBoundingClientRect = () => ({ width: 120, height: 40 });
    const out = inlineSvg(svg);
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('width="120"');
    expect(out).toContain('height="40"');
  });

  test('copies the listed computed style properties onto every element and keeps existing style', () => {
    const svg = make();
    const out = inlineSvg(svg);
    ['fill:', 'stroke:', 'stroke-width:', 'stroke-dasharray:', 'stroke-linecap:', 'stroke-linejoin:',
      'opacity:', 'font-size:', 'font-family:', 'font-weight:'].forEach((p) => expect(out).toContain(p));
    expect(out).toContain('color:red');
    expect(out.match(/style="/g)).toHaveLength(2); // svg + path
  });

  test('does not modify the original element', () => {
    const svg = make();
    inlineSvg(svg);
    expect(svg.getAttribute('style')).toBeNull();
    expect(svg.firstChild.getAttribute('style')).toBe('color:red');
  });
});

describe('shareCanvas', () => {
  const blob = new Blob(['x'], { type: 'image/png' });
  const canvasWith = (b) => ({ toBlob: (cb) => cb(b) });
  const saved = {};
  beforeEach(() => {
    saved.clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    saved.item = window.ClipboardItem;
    saved.create = URL.createObjectURL;
    saved.revoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    if (saved.clipboard) Object.defineProperty(navigator, 'clipboard', saved.clipboard);
    else delete navigator.clipboard;
    window.ClipboardItem = saved.item;
    URL.createObjectURL = saved.create;
    URL.revokeObjectURL = saved.revoke;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  const setClipboard = (write) => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: write ? { write } : undefined });
    window.ClipboardItem = class { constructor(d) { this.d = d; } };
  };

  test('rejects when the canvas cannot produce a blob', async () => {
    await expect(shareCanvas(canvasWith(null), 'a.png')).rejects.toThrow('Could not create image');
  });

  test('copies to the clipboard when allowed', async () => {
    const write = vi.fn().mockResolvedValue();
    setClipboard(write);
    await expect(shareCanvas(canvasWith(blob), 'a.png')).resolves.toBe('copied');
    expect(write).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test('falls back to a download when the clipboard write is blocked', async () => {
    vi.useFakeTimers();
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await expect(shareCanvas(canvasWith(blob), 'lap.png')).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  test('downloads when the Clipboard API is unavailable', async () => {
    setClipboard(null);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await expect(shareCanvas(canvasWith(blob), 'lap.png')).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalled();
  });
});