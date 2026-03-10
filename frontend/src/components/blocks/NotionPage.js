import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { NotionRenderer } from 'react-notion-x';
import 'react-notion-x/src/styles.css';
import './NotionPage.css';

function NotionPage() {
  const { type, id } = useParams();
  const [recordMap, setRecordMap] = useState(null);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);

  useEffect(() => {
    async function loadPage() {
      try {
        // Load the manifest to find page info
        const manifest = await import('../../data/notion/pages.json');
        const info = manifest[id] || manifest.default?.[id];

        if (!info) {
          setError('Page not found');
          return;
        }

        // Verify the section matches the URL type
        if (info.section !== type) {
          setError('Page not found');
          return;
        }

        setPageInfo(info);

        // Load the page's recordMap
        const data = await import(`../../data/notion/${id}.json`);
        setRecordMap(data.default || data);
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
      </div>
    );
  }

  if (!recordMap) {
    return (
      <div className="notion-page-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="notion-page-wrapper">
      <NotionRenderer
        recordMap={recordMap}
        fullPage={true}
        darkMode={false}
        disableHeader={false}
      />
    </div>
  );
}

export default NotionPage;
