import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NotionRenderer } from 'react-notion-x';
import 'react-notion-x/src/styles.css';
import './NotionPage.css';
import NotionPdf from './NotionPdf';

function NotionPage() {
  const { type, id } = useParams();
  const [recordMap, setRecordMap] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setRecordMap(null);
    setError(null);

    async function loadPage() {
      try {
        // Try loading the JSON file directly by slug
        const resp = await fetch(`${process.env.PUBLIC_URL}/notion/${id}.json`);
        if (!resp.ok) {
          setError('Page not found');
          return;
        }
        const data = await resp.json();
        setRecordMap(data);

        // Extract title from the page block
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
  );
}

export default NotionPage;
