import React from 'react';
import PdfViewer from './PdfViewer';

/**
 * Custom Pdf component for react-notion-x.
 * The sync script rewrites Notion attachment sources to local paths
 * (e.g. "projects/papers/LPCVD.pdf" or "projects/presentations/LPCVD.pdf").
 * If the source is still an attachment URL (not yet synced), extract the filename.
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

  return <PdfViewer fileUrl={localUrl} />;
}
