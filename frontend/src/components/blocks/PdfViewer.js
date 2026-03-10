import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfViewer.css';
import { publicFile } from '../../App.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = publicFile("/tools/pdf.worker.js");

const PAGES_PER_BATCH = 10;

export default function PdfViewer({ fileUrl }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [loadedCount, setLoadedCount] = useState(PAGES_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const baseScaleRef = useRef(0);
  const containerRef = useRef(null);
  const pagesRef = useRef(null);
  const pageRefs = useRef([]);

  const resolvedUrl = fileUrl.startsWith('http')
    ? fileUrl
    : publicFile(fileUrl);

  // Load PDF
  useEffect(() => {
    setError(null);
    setPdfDoc(null);
    setPages([]);
    baseScaleRef.current = 0;

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(resolvedUrl).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setPageInput('1');
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message || 'Unknown error loading PDF');
      }
    };

    loadPdf();
  }, [resolvedUrl]);

  // Reset loaded count when pdf/scale/rotation changes
  useEffect(() => {
    setLoadedCount(PAGES_PER_BATCH);
  }, [pdfDoc, scale, rotation]);

  // Render pages up to loadedCount
  useEffect(() => {
    if (!pdfDoc) return;

    const renderPages = async () => {
      const pagesToRender = Math.min(loadedCount, pdfDoc.numPages);
      const containerWidth = (containerRef.current?.clientWidth || 800) - 80;
      const newPages = [];

      for (let i = 1; i <= pagesToRender; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1, rotation });

        const finalBaseScale = baseScaleRef.current || (baseScaleRef.current = containerWidth / viewport.width);
        const finalViewport = page.getViewport({ scale: finalBaseScale * scale, rotation });

        const canvas = document.createElement('canvas');
        canvas.width = finalViewport.width;
        canvas.height = finalViewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: finalViewport }).promise;
        newPages.push(canvas);
      }

      setPages(newPages);
      setIsLoadingMore(false);
    };

    renderPages();
  }, [pdfDoc, scale, rotation, loadedCount]);

  // Track current page on scroll + load more when near bottom
  const handleScroll = useCallback(() => {
    if (!pagesRef.current || pageRefs.current.length === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = pagesRef.current;
    const scrollMid = scrollTop + clientHeight / 3;

    // Track current page
    for (let i = pageRefs.current.length - 1; i >= 0; i--) {
      const el = pageRefs.current[i];
      if (el && el.offsetTop <= scrollMid) {
        const newPage = i + 1;
        if (newPage !== currentPage) {
          setCurrentPage(newPage);
          setPageInput(String(newPage));
        }
        break;
      }
    }

    // Load next batch when scrolled within 300px of bottom
    const nearBottom = scrollHeight - scrollTop - clientHeight < 300;
    if (nearBottom && !isLoadingMore && loadedCount < totalPages) {
      setIsLoadingMore(true);
      setLoadedCount(prev => Math.min(prev + PAGES_PER_BATCH, totalPages));
    }
  }, [currentPage, isLoadingMore, loadedCount, totalPages]);

  const handleZoomIn = () => {
    baseScaleRef.current = 0;
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    baseScaleRef.current = 0;
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleFitPage = () => {
    baseScaleRef.current = 0;
    setScale(1);
  };

  const handleRotate = () => {
    baseScaleRef.current = 0;
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePageInput = (e) => {
    const val = e.target.value;
    setPageInput(val);
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (num >= 1 && num <= totalPages) {
      goToPage(num);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const goToPage = (num) => {
    // Load pages up to target if not yet rendered
    if (num > loadedCount) {
      const needed = Math.ceil(num / PAGES_PER_BATCH) * PAGES_PER_BATCH;
      setLoadedCount(Math.min(needed, totalPages));
    }

    // Scroll after a brief delay to allow render
    setTimeout(() => {
      const el = pageRefs.current[num - 1];
      if (el && pagesRef.current) {
        pagesRef.current.scrollTo({ top: el.offsetTop - 10, behavior: 'smooth' });
      }
    }, num > loadedCount ? 500 : 0);

    setCurrentPage(num);
    setPageInput(String(num));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.download = resolvedUrl.split('/').pop() || 'document.pdf';
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open(resolvedUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => printWindow.print());
    }
  };

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  return (
    <div className="chrome-pdf-viewer" ref={containerRef}>
      {/* Chrome-style toolbar */}
      <div className="chrome-pdf-toolbar">
        <div className="chrome-pdf-toolbar__left">
          {/* Page navigation */}
          <button
            className="chrome-pdf-btn"
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <form onSubmit={handlePageSubmit} className="chrome-pdf-page-nav">
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInput}
              className="chrome-pdf-page-input"
            />
            <span className="chrome-pdf-page-total">/ {totalPages}</span>
          </form>

          <button
            className="chrome-pdf-btn"
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            title="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        <div className="chrome-pdf-toolbar__center">
          {/* Zoom controls */}
          <button className="chrome-pdf-btn" onClick={handleZoomOut} title="Zoom out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>

          <span className="chrome-pdf-zoom-level" onClick={handleFitPage} title="Reset zoom">
            {Math.round(scale * 100)}%
          </span>

          <button className="chrome-pdf-btn" onClick={handleZoomIn} title="Zoom in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

        <div className="chrome-pdf-toolbar__right">
          <button className="chrome-pdf-btn" onClick={handleRotate} title="Rotate clockwise">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 4a7.49 7.49 0 0 1 6.38 3.56l-2.38.56L21 11l1.5-5-2.09.49A9.49 9.49 0 0 0 12.5 2C7.26 2 3 6.26 3 11.5S7.26 21 12.5 21c4.56 0 8.33-3.22 9.26-7.5h-2.07A7.5 7.5 0 1 1 12.5 4z"/>
            </svg>
          </button>

          <div className="chrome-pdf-separator" />

          <button className="chrome-pdf-btn" onClick={handlePrint} title="Print">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
          </button>

          <button className="chrome-pdf-btn" onClick={handleDownload} title="Download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>

          <button className="chrome-pdf-btn" onClick={handleFullscreen} title="Fullscreen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="chrome-pdf-error">
          <p>Failed to load PDF</p>
          <p className="chrome-pdf-error-detail">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {!error && pages.length === 0 && (
        <div className="chrome-pdf-loading">
          <div className="chrome-pdf-spinner" />
        </div>
      )}

      {/* Pages */}
      <div className="chrome-pdf-pages" ref={pagesRef} onScroll={handleScroll}>
        {pages.map((canvas, i) => (
          <div
            key={i}
            className="chrome-pdf-page"
            ref={el => { pageRefs.current[i] = el; }}
          >
            <div
              className="chrome-pdf-page-canvas"
              ref={el => { if (el && !el.hasChildNodes()) el.appendChild(canvas); }}
            />
          </div>
        ))}
        {isLoadingMore && (
          <div className="chrome-pdf-loading-more">
            <div className="chrome-pdf-spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
