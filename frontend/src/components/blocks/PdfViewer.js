import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import './PdfViewer.css';
import { publicFile } from '../../App.js';

// ✅ Tell pdf.js where to find the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = publicFile("/tools/pdf.worker.js");

export default function PdfViewer({ fileUrl }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const baseScaleRef = useRef(0); // 👈 fixed base scaling factor
  const containerRef = useRef(null);

  const resolvedUrl = fileUrl.startsWith('http')
    ? fileUrl
    : publicFile(fileUrl);

  // Load PDF
  useEffect(() => {
    setError(null);
    setPdfDoc(null);
    setPages([]);

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(resolvedUrl).promise;
        setPdfDoc(pdf);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message || 'Unknown error loading PDF');
      }
    };

    loadPdf();
  }, [resolvedUrl]);

  // Render pages

  useEffect(() => {
    if (!pdfDoc) return;

    const renderPages = async () => {
      const newPages = [];
      const total = pdfDoc.numPages;
      const containerWidth = containerRef.current?.clientWidth || 800;

      for (let i = 1; i <= total; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });

        // use ref for baseScale
        const finalBaseScale = baseScaleRef.current || (baseScaleRef.current = containerWidth / viewport.width);

        const finalViewport = page.getViewport({ scale: finalBaseScale * scale });

        const canvas = document.createElement('canvas');
        canvas.width = finalViewport.width;
        canvas.height = finalViewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: finalViewport }).promise;
        newPages.push(canvas);
      }

      setPages(newPages);
    };

  renderPages();
}, [pdfDoc, scale]); // ✅ no warning, ref doesn’t need deps


  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleFullscreen = () => containerRef.current?.requestFullscreen?.();

  return (
    <div className="pdf-container bg-white p-4" ref={containerRef}>
      {error && <div className="text-red-600 mb-2">Failed to load PDF: {error}</div>}

      {/* ✅ Show Loading until pages render */}
      {!error && pages.length === 0 && <p>Loading PDF...</p>}

      {/* Toolbar */}
      {pdfDoc && (
        <div className="pdf-toolbar mb-2 flex items-center gap-2">
          <button onClick={handleZoomOut} className="px-2 py-1 bg-gray-200 rounded">−</button>
          <span className="text-gray-700">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="px-2 py-1 bg-gray-200 rounded">+</button>
          <button onClick={handleFullscreen} className="px-2 py-1 bg-gray-200 rounded">Fullscreen</button>
          <span className="text-sm text-gray-600 ml-2">Pages: {pages.length}</span>
        </div>
      )}

      {/* Pages */}
      <div className="pdf-pages overflow-auto max-h-[80vh]">
        {pages.map((canvas, i) => (
          <div key={i} className="pdf-page mb-4">
            <div
              ref={el => { if (el && !el.hasChildNodes()) el.appendChild(canvas); }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
