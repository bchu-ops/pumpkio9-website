import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfPage from './PdfPage';
import PdfToolbar from './PdfToolbar';
import './PdfViewer.css';
import { publicFile } from '../../App.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = publicFile('/tools/pdf.worker.js');

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const PAGE_PADDING = 8; // small gap so a fitted page never touches the edges

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

// Placeholder size for every page, taken from page 1 so the viewer can show
// right away. A page with a different size corrects itself when it draws.
async function readPageSizes(pdf) {
  const { width, height } = (await pdf.getPage(1)).getViewport({ scale: 1 });
  return Array.from({ length: pdf.numPages }, () => ({ width, height }));
}

export default function PdfViewer({ fileUrl }) {
  const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : publicFile(fileUrl);
  const fileName = decodeURIComponent(resolvedUrl.split('/').pop() || 'document.pdf');

  const [pdf, setPdf] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitWidth, setFitWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);
  const pagesRef = useRef(null);
  const scrollRatioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let task = null;
    setPdf(null);
    setSizes([]);
    setError(null);
    setCurrentPage(1);

    const load = async () => {
      try {
        task = pdfjsLib.getDocument(resolvedUrl);
        const doc = await task.promise;
        const pageSizes = await readPageSizes(doc);
        if (cancelled) return;
        setSizes(pageSizes);
        setPdf(doc);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load PDF:', err);
          setError(err.message || 'Unknown error loading PDF');
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [resolvedUrl]);

  // Keep pages fitted to the viewer width as the window or layout changes.
  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setFitWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const widest = sizes.reduce((max, s) => Math.max(max, rotation % 180 ? s.height : s.width), 0);
  const fitScale = widest && fitWidth ? Math.max(0.1, (fitWidth - PAGE_PADDING) / widest) : 0;
  const scale = fitScale * zoom;

  // Zooming or rotating should keep the reader at the same spot in the document.
  const changeView = useCallback((update) => {
    const el = pagesRef.current;
    if (el && el.scrollHeight > 0) scrollRatioRef.current = el.scrollTop / el.scrollHeight;
    update();
  }, []);

  useLayoutEffect(() => {
    const el = pagesRef.current;
    if (el && scrollRatioRef.current !== null) {
      el.scrollTop = scrollRatioRef.current * el.scrollHeight;
      scrollRatioRef.current = null;
    }
  }, [scale, rotation]);

  const zoomBy = useCallback((delta) => changeView(() => setZoom((z) => clampZoom(z + delta))), [changeView]);
  const resetZoom = useCallback(() => changeView(() => setZoom(1)), [changeView]);
  const rotate = useCallback(() => changeView(() => setRotation((r) => (r + 90) % 360)), [changeView]);

  const goToPage = useCallback((num) => {
    const target = Math.min(Math.max(num, 1), sizes.length);
    const el = pagesRef.current?.querySelector(`[data-page-number="${target}"]`);
    if (el) pagesRef.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
    setCurrentPage(target);
  }, [sizes.length]);

  const handleScroll = () => {
    const container = pagesRef.current;
    if (!container) return;
    const marker = container.scrollTop + container.clientHeight / 3;
    const pages = container.querySelectorAll('[data-page-number]');
    let page = 1;
    pages.forEach((el) => { if (el.offsetTop <= marker) page = Number(el.dataset.pageNumber); });
    // The last page can be too short to reach the marker, so count the bottom as the last page.
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
    if (atBottom && pages.length) page = pages.length;
    if (page !== currentPage) setCurrentPage(page);
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT') return;
    const actions = {
      ArrowRight: () => goToPage(currentPage + 1),
      ArrowLeft: () => goToPage(currentPage - 1),
      PageDown: () => goToPage(currentPage + 1),
      PageUp: () => goToPage(currentPage - 1),
      Home: () => goToPage(1),
      End: () => goToPage(sizes.length),
      '+': () => zoomBy(ZOOM_STEP),
      '=': () => zoomBy(ZOOM_STEP),
      '-': () => zoomBy(-ZOOM_STEP),
      0: () => resetZoom(),
    };
    const action = actions[e.key];
    if (action && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      action();
    }
  };

  // Ctrl/⌘ + scroll wheel (and trackpad pinch) zooms the document, not the page.
  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else viewerRef.current?.requestFullscreen?.();
  };

  const isLoading = !error && (!pdf || !scale);

  return (
    <div
      className="chrome-pdf-viewer"
      ref={viewerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`PDF viewer: ${fileName}`}
    >
      <PdfToolbar
        currentPage={currentPage}
        totalPages={sizes.length}
        zoom={zoom}
        fileUrl={resolvedUrl}
        fileName={fileName}
        isFullscreen={isFullscreen}
        onGoToPage={goToPage}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(-ZOOM_STEP)}
        onResetZoom={resetZoom}
        onRotate={rotate}
        onToggleFullscreen={toggleFullscreen}
      />

      <div className="chrome-pdf-pages" ref={pagesRef} onScroll={handleScroll}>
        {error && (
          <div className="chrome-pdf-error" role="alert">
            <p>Couldn't load this PDF</p>
            <p className="chrome-pdf-error-detail">{error}</p>
            <a className="chrome-pdf-error-link" href={resolvedUrl} target="_blank" rel="noopener noreferrer">
              Open it directly
            </a>
          </div>
        )}

        {isLoading && (
          <div className="chrome-pdf-loading" aria-label="Loading PDF">
            <div className="chrome-pdf-spinner" />
          </div>
        )}

        {!isLoading && !error && sizes.map((size, i) => (
          <PdfPage
            key={i + 1}
            pdf={pdf}
            pageNumber={i + 1}
            size={size}
            scale={scale}
            rotation={rotation}
            rootRef={pagesRef}
          />
        ))}
      </div>
    </div>
  );
}
