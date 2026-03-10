import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NotionRenderer } from 'react-notion-x';
import 'react-notion-x/src/styles.css';
import NotionPdf from '../blocks/NotionPdf';
import '../blocks/NotionPage.css';
import './SubPageLayout.css';
import { publicFile } from '../../App';

const SLUG_RE = /^[a-z0-9-]+$/;

const SECTION_LABELS = {
  experiences: 'Experiences',
  projects: 'Projects',
  papers: 'Papers & Publications',
};

export default function SubPage() {
  const { type, id } = useParams();
  const [recordMap, setRecordMap] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRecordMap(null);
    setMeta(null);
    setError(null);

    if (!SLUG_RE.test(id)) {
      setError('Invalid page ID');
      return;
    }

    const loadData = async () => {
      try {
        // Load collection metadata
        const colResp = await fetch(`${process.env.PUBLIC_URL}/notion/collections.json`);
        if (colResp.ok) {
          const collections = await colResp.json();
          const items = collections[type] || [];
          const match = items.find(item => item.slug === id);
          if (match) setMeta(match);
        }

        // Load Notion page JSON
        const pageResp = await fetch(`${process.env.PUBLIC_URL}/notion/${id}.json`);
        if (!pageResp.ok) {
          setError('Page not found');
          return;
        }
        const data = await pageResp.json();
        setRecordMap(data);
      } catch (err) {
        console.error('Failed to load subpage:', err);
        setError('Failed to load page');
      }
    };

    loadData();
  }, [type, id]);

  if (error) {
    return (
      <div className="subpage">
        <div className="subpage-error">
          <h1>{error}</h1>
          <p>The page &ldquo;{id}&rdquo; was not found in {type}.</p>
          <Link to="/" className="subpage-back">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!recordMap) {
    return (
      <div className="subpage">
        <div className="subpage-loading">
          <div className="subpage-spinner" />
        </div>
      </div>
    );
  }

  const sectionLabel = SECTION_LABELS[type] || type;
  const title = meta?.title || id.replace(/-/g, ' ');
  const coverImage = meta?.image
    ? getCoverUrl(type, meta.image)
    : null;

  return (
    <div className="subpage">
      {/* Breadcrumb */}
      <div className="subpage-breadcrumb">
        <Link to="/">{sectionLabel}</Link>
        <span className="subpage-breadcrumb-sep">/</span>
        <span>{title}</span>
      </div>

      {/* Cover image */}
      {coverImage && (
        <div className="subpage-cover">
          <img src={coverImage} alt={title} />
        </div>
      )}

      {/* Title */}
      <h1 className="subpage-title">{title}</h1>

      {/* Metadata bar */}
      {meta && (
        <div className="subpage-meta">
          {type === 'experiences' && (
            <>
              {meta.position && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Position</span>
                  {Array.isArray(meta.position) ? meta.position.join(', ') : meta.position}
                </span>
              )}
              {meta.team && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Team</span>
                  {meta.team}
                </span>
              )}
              {meta.duration && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Duration</span>
                  {formatDuration(meta.duration)}
                </span>
              )}
            </>
          )}
          {(type === 'projects' || type === 'papers') && (
            <>
              {meta.description && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Description</span>
                  {meta.description}
                </span>
              )}
              {meta.tools && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Tools</span>
                  {meta.tools}
                </span>
              )}
              {meta.link && (
                <span className="subpage-meta-item">
                  <span className="subpage-meta-label">Link</span>
                  <a href={meta.link} target="_blank" rel="noopener noreferrer">{meta.link}</a>
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Notion content */}
      <div className="subpage-content">
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

function getCoverUrl(section, image) {
  if (image.startsWith('http')) return image;
  const folderMap = {
    experiences: 'experiences',
    projects: 'projects',
    papers: 'projects',
  };
  const folder = folderMap[section] || section;
  return publicFile(`images/covers/${folder}/${image}`);
}

function formatDuration(duration) {
  if (!duration) return '';
  if (typeof duration === 'string') return duration;
  const { start, end } = duration;
  if (start && end) return `${start} — ${end}`;
  return start || '';
}
