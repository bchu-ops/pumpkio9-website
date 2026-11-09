import React, { useEffect, useState } from 'react';

const ICONS = {
  prev: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  next: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  zoomOut: 'M19 13H5v-2h14v2z',
  zoomIn: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  rotate: 'M12.5 4a7.49 7.49 0 0 1 6.38 3.56l-2.38.56L21 11l1.5-5-2.09.49A9.49 9.49 0 0 0 12.5 2C7.26 2 3 6.26 3 11.5S7.26 21 12.5 21c4.56 0 8.33-3.22 9.26-7.5h-2.07A7.5 7.5 0 1 1 12.5 4z',
  newTab: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  exitFullscreen: 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
};

function Icon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function ToolButton({ label, icon, onClick, disabled }) {
  return (
    <button
      type="button"
      className="chrome-pdf-btn"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  );
}

export default function PdfToolbar({
  currentPage, totalPages, zoom, fileUrl, fileName, isFullscreen,
  onGoToPage, onZoomIn, onZoomOut, onResetZoom, onRotate, onToggleFullscreen,
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => setPageInput(String(currentPage)), [currentPage]);

  const submitPage = (e) => {
    e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (num >= 1 && num <= totalPages) onGoToPage(num);
    else setPageInput(String(currentPage));
  };

  return (
    <div className="chrome-pdf-toolbar" role="toolbar" aria-label="PDF controls">
      <div className="chrome-pdf-toolbar__left">
        <ToolButton label="Previous page" icon="prev" onClick={() => onGoToPage(currentPage - 1)} disabled={currentPage <= 1} />
        <form onSubmit={submitPage} className="chrome-pdf-page-nav">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Page number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={submitPage}
            className="chrome-pdf-page-input"
          />
          <span className="chrome-pdf-page-total">/ {totalPages || '–'}</span>
        </form>
        <ToolButton label="Next page" icon="next" onClick={() => onGoToPage(currentPage + 1)} disabled={currentPage >= totalPages} />
      </div>

      <div className="chrome-pdf-toolbar__center">
        <ToolButton label="Zoom out (−)" icon="zoomOut" onClick={onZoomOut} />
        <button type="button" className="chrome-pdf-zoom-level" onClick={onResetZoom} title="Fit to width (0)" aria-label="Fit to width">
          {Math.round(zoom * 100)}%
        </button>
        <ToolButton label="Zoom in (+)" icon="zoomIn" onClick={onZoomIn} />
      </div>

      <div className="chrome-pdf-toolbar__right">
        <ToolButton label="Rotate clockwise" icon="rotate" onClick={onRotate} />
        <div className="chrome-pdf-separator" />
        <a className="chrome-pdf-btn" href={fileUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab" aria-label="Open in new tab">
          <Icon name="newTab" />
        </a>
        <a className="chrome-pdf-btn" href={fileUrl} download={fileName} title="Download" aria-label="Download">
          <Icon name="download" />
        </a>
        <ToolButton
          label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          icon={isFullscreen ? 'exitFullscreen' : 'fullscreen'}
          onClick={onToggleFullscreen}
        />
      </div>
    </div>
  );
}
