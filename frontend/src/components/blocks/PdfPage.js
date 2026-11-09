import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Start rendering a page a little before it scrolls into view.
const PRELOAD_MARGIN = '800px 0px';

/**
 * One PDF page. Shows a correctly sized blank placeholder until the page is
 * near the viewport, then draws a sharp (devicePixelRatio-aware) canvas plus
 * a selectable text layer. Re-draws when the zoom or rotation changes.
 */
export default function PdfPage({ pdf, pageNumber, size, scale, rotation, rootRef, onRendered }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const [isNear, setIsNear] = useState(false);
  const [realSize, setRealSize] = useState(null);

  const base = realSize || size;
  const rotated = rotation % 180 !== 0;
  const width = (rotated ? base.height : base.width) * scale;
  const height = (rotated ? base.width : base.height) * scale;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || isNear) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsNear(true); },
      { root: rootRef.current, rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNear, rootRef]);

  useEffect(() => {
    if (!isNear) return undefined;
    let cancelled = false;
    let renderTask = null;
    let textTask = null;

    const draw = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const unscaled = page.getViewport({ scale: 1 });
        setRealSize((prev) => (prev?.width === unscaled.width && prev?.height === unscaled.height
          ? prev : { width: unscaled.width, height: unscaled.height }));
        const viewport = page.getViewport({ scale, rotation });
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTask = page.render({
          canvasContext: canvas.getContext('2d'),
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        });
        await renderTask.promise;
        if (cancelled) return;

        const textLayer = textRef.current;
        textLayer.replaceChildren();
        const textContent = await page.getTextContent();
        if (cancelled) return;
        textTask = pdfjsLib.renderTextLayer({ textContent, container: textLayer, viewport, textDivs: [] });
        await textTask.promise;
        if (!cancelled) onRendered?.(pageNumber);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Failed to render PDF page ${pageNumber}:`, err);
        }
      }
    };

    draw();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      textTask?.cancel?.();
    };
  }, [isNear, pdf, pageNumber, scale, rotation, onRendered]);

  return (
    <div
      ref={wrapperRef}
      className="chrome-pdf-page"
      data-page-number={pageNumber}
      style={{ width, height }}
    >
      <canvas ref={canvasRef} />
      <div ref={textRef} className="textLayer" />
    </div>
  );
}
