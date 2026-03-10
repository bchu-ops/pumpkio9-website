import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './Cards.css'
import { publicFile } from '../App'

const FALLBACK_IMAGE = 'images/img-3.jpg';

const VIEW_OPTIONS = [
  { value: 'gallery', label: 'Gallery', icon: 'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z' },
  { value: 'table', label: 'Table', icon: 'M3 3h18v18H3V3zm2 4v4h6V7H5zm8 0v4h6V7h-6zm-8 6v4h6v-4H5zm8 0v4h6v-4h-6z' },
];

const SECTION_COLUMNS = {
  experiences: [
    { key: 'title', label: 'Name' },
    { key: 'position', label: 'Position', render: v => Array.isArray(v) ? v.join(', ') : v },
    { key: 'team', label: 'Team' },
    { key: 'duration', label: 'Duration', render: v => {
      if (!v) return '';
      if (typeof v === 'object') {
        const { start, end } = v;
        if (start && end) return `${start} — ${end}`;
        return start || '';
      }
      return v;
    }},
  ],
  projects: [
    { key: 'title', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'tools', label: 'Tools' },
  ],
  papers: [
    { key: 'title', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'tools', label: 'Tools' },
  ],
};

function NotionCards() {
  const [viewModes, setViewModes] = useState({
    experiences: 'gallery',
    projects: 'gallery',
    papers: 'gallery',
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [collections, setCollections] = useState(null);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpenDropdown(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    async function loadCollections() {
      try {
        const resp = await fetch(`${process.env.PUBLIC_URL}/notion/collections.json`);
        if (!resp.ok) {
          setError('Failed to load collections');
          return;
        }
        const data = await resp.json();
        setCollections(data);
      } catch (err) {
        console.error('Failed to load Notion collections:', err);
        setError('Failed to load collections');
      }
    }
    loadCollections();
  }, []);

  const getImageSrc = (row) => {
    if (row.image) {
      if (row.image.startsWith('http')) return row.image;
      // Map sections to image subfolders
      const section = row.section || '';
      const folderMap = {
        'experiences': 'experiences',
        'projects': 'projects',
        'papers': 'projects',  // papers images are stored in projects folder
      };
      const folder = folderMap[section];
      if (folder) {
        return publicFile(`images/covers/${folder}/${row.image}`);
      }
      return publicFile(`images/covers/${row.image}`);
    }
    return publicFile(FALLBACK_IMAGE);
  };

  const getPath = (section, row) => {
    // Use pre-computed slug if available, otherwise generate
    if (row.slug) return `/${section}/${row.slug}`;
    const slug = row.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-|-$/g, '');
    return `/${section}/${slug}`;
  };

  const setViewMode = (sectionKey, mode) => {
    setViewModes(prev => ({ ...prev, [sectionKey]: mode }));
  };

  const renderSection = (title, sectionKey, rows) => {
    if (!rows || rows.length === 0) return null;

    const viewMode = viewModes[sectionKey] || 'gallery';

    const currentOption = VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0];
    const isOpen = openDropdown === sectionKey;

    return (
      <div className="notion-collection-section">
        {/* Section title */}
        <div className="notion-collection-header">
          <span className="notion-collection-header-title">{title}</span>
        </div>

        {/* View switcher dropdown — sits between title and content */}
        <div className="notion-view-bar" ref={isOpen ? dropdownRef : null}>
          <button
            className="notion-collection-view-dropdown"
            onClick={() => setOpenDropdown(isOpen ? null : sectionKey)}
          >
            <span className="notion-collection-view-type">
              <svg className="notion-collection-view-type-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d={currentOption.icon} />
              </svg>
              <span style={{ marginLeft: 6 }}>{currentOption.label}</span>
            </span>
            <svg className="notion-collection-view-dropdown-icon" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>

          {isOpen && (
            <div className="notion-view-dropdown-menu">
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`notion-view-dropdown-item ${viewMode === opt.value ? 'notion-view-dropdown-item-active' : ''}`}
                  onClick={() => {
                    setViewMode(sectionKey, opt.value);
                    setOpenDropdown(null);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8, opacity: 0.65 }}>
                    <path d={opt.icon} />
                  </svg>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery view */}
        {viewMode === 'gallery' && (
          <div className="notion-gallery-grid">
            {rows.map((row) => (
              <Link key={row.id} to={getPath(sectionKey, row)} className="notion-collection-card">
                <div className="notion-collection-card-cover">
                  <img src={getImageSrc(row)} alt={row.title} style={{ objectFit: 'cover' }} />
                </div>
                <div className="notion-collection-card-body">
                  <div className="notion-collection-card-property">{row.title}</div>
                  <div className="notion-collection-card-property">{getCardText(sectionKey, row)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <div className="notion-table-view">
            <table className="notion-table">
              <thead>
                <tr>
                  {(SECTION_COLUMNS[sectionKey] || []).map(col => (
                    <th key={col.key} className="notion-table-th">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="notion-table-row">
                    {(SECTION_COLUMNS[sectionKey] || []).map(col => (
                      <td key={col.key} className="notion-table-cell">
                        {col.key === 'title' ? (
                          <Link to={getPath(sectionKey, row)} className="notion-table-cell-title">
                            {row.title}
                          </Link>
                        ) : (
                          <span className="notion-table-cell-text">
                            {col.render ? col.render(row[col.key]) : (row[col.key] || '')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const getCardText = (section, row) => {
    if (section === 'experiences') {
      const positions = row.position || [];
      return positions.join(', ') || row.team || '';
    }
    if (section === 'projects') {
      return row.description || row.tools || '';
    }
    if (section === 'papers') {
      return row.description || '';
    }
    return '';
  };

  if (error) {
    return <div className="cards"><p>{error}</p></div>;
  }

  if (!collections) {
    return <div className="cards"><p>Loading...</p></div>;
  }

  return (
    <div className='cards'>
      <div className='cards__container'>
        {renderSection('Experiences', 'experiences', collections.experiences)}
        {renderSection('Projects', 'projects', collections.projects)}
        {renderSection('Papers & Publications', 'papers', collections.papers)}

        {/* Resume section — local public folder PDFs */}
        <div className="notion-collection-section">
          <div className="notion-collection-header">
            <span className="notion-collection-header-title">Resume</span>
          </div>
          <div className="notion-resume-links">
            <a
              href={publicFile('resume/Brian_Chu_Resume.pdf')}
              target="_blank"
              rel="noopener noreferrer"
              className="notion-resume-link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.65, marginRight: 8, flexShrink: 0 }}>
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
              </svg>
              Brian_Chu_Resume.pdf
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotionCards;
