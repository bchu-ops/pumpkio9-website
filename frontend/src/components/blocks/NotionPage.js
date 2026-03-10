import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NotionRenderer } from 'react-notion-x';
import 'react-notion-x/src/styles.css';
import './NotionPage.css';
import NotionPdf from './NotionPdf';

const SLUG_RE = /^[a-z0-9-]+$/;

function NotionPage() {
  const { type, id } = useParams();
  const [recordMap, setRecordMap] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [error, setError] = useState(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    setRecordMap(null);
    setError(null);

    async function loadPage() {
      if (!SLUG_RE.test(id)) {
        setError('Invalid page ID');
        return;
      }
      try {
        const resp = await fetch(`${process.env.PUBLIC_URL}/notion/${id}.json`);
        if (!resp.ok) {
          setError('Page not found');
          return;
        }
        const data = await resp.json();
        setRecordMap(data);

        const blocks = data.block || {};
        for (const b of Object.values(blocks)) {
          const val = b.value || {};
          if (val.type === 'page' && val.properties?.title) {
            const parts = val.properties.title;
            const title = parts.map(p => (Array.isArray(p) ? p[0] : '')).join('');
            if (title) {
              setPageTitle(title);
              break;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Notion page:', err);
        setError('Failed to load page');
      }
    }

    loadPage();
  }, [type, id]);

  // Group consecutive PDF wrappers into a flex row after render
  const groupPdfBlocks = useCallback(() => {
    const container = rendererRef.current;
    if (!container) return;
    const pdfWrappers = container.querySelectorAll('.notion-asset-wrapper-pdf');
    if (pdfWrappers.length < 2) return;
    if (container.querySelector('.notion-pdf-row')) return;

    for (let i = 0; i < pdfWrappers.length - 1; i += 2) {
      const first = pdfWrappers[i];
      const second = pdfWrappers[i + 1];
      if (first.nextElementSibling !== second) continue;

      const row = document.createElement('div');
      row.className = 'notion-pdf-row';
      first.parentNode.insertBefore(row, first);
      row.appendChild(first);
      row.appendChild(second);
    }
  }, []);

  useEffect(() => {
    if (recordMap) {
      const timer = setTimeout(groupPdfBlocks, 100);
      return () => clearTimeout(timer);
    }
  }, [recordMap, groupPdfBlocks]);

  if (error) {
    return (
      <div className="notion-page-error">
        <h1>{error}</h1>
        <p>The page "{id}" was not found in {type}.</p>
        <Link to="/" className="notion-page-back">Back to Home</Link>
      </div>
    );
  }

  if (!recordMap) {
    return (
      <div className="notion-page-loading">
        <div className="notion-page-spinner" />
      </div>
    );
  }

  return (
    <div className="notion-page-wrapper">
      <div className="notion-page-breadcrumb">
        <Link to="/">{type.charAt(0).toUpperCase() + type.slice(1)}</Link>
        <span className="notion-page-breadcrumb-sep">/</span>
        <span>{pageTitle || id.replace(/-/g, ' ')}</span>
      </div>
      {pageTitle && <h1 className="notion-page-title">{pageTitle}</h1>}
      <div ref={rendererRef}>
        <NotionRenderer
          recordMap={recordMap}
          fullPage={false}
          darkMode={false}
          disableHeader={false}
          mapPageUrl={(pageId) => `/${type}/${pageId}`}
          components={{
            Pdf: NotionPdf,
          }}
        />
      </div>
    </div>
  );
}

export default NotionPage;
