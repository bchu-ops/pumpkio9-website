import React from 'react';
import PdfViewer from './PdfViewer';

/**
 * Custom Pdf component for react-notion-x.
 * The sync script rewrites Notion attachment sources to local paths
 * (e.g. "projects/papers/LPCVD.pdf" or "projects/presentations/LPCVD.pdf").
 */
export default function NotionPdf({ file }) {
  if (!file) {
    return <p style={{ padding: '1rem', color: '#999' }}>PDF not available</p>;
  }

  // Handle un-rewritten attachment URLs as fallback
  let localUrl = file;
  if (file.startsWith('attachment:')) {
    const parts = file.split(':');
    const filename = parts.length >= 3 ? parts.slice(2).join(':') : 'unknown.pdf';
    localUrl = `projects/papers/${filename}`;
  }

  // Determine label from path
  const isPaper = localUrl.includes('/papers/');
  const label = isPaper ? 'Paper' : 'Presentation';

  return (
    <div className="notion-pdf-labeled">
      <div className="notion-pdf-label">{label}</div>
      <PdfViewer fileUrl={localUrl} />
    </div>
  );
}
