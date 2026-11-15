import React from 'react';
import { useParams } from 'react-router-dom';

const NotionPage = React.lazy(() => import('./NotionPage'));

// Local JS pages per type, keyed by lower-case file name (e.g. "lpcvd").
// Loaded lazily so the PDF viewer only downloads when a paper is opened.
const byName = (loaders) => Object.fromEntries(
  Object.entries(loaders).map(([file, load]) => [file.split('/').pop().replace(/\.jsx?$/, '').toLowerCase(), React.lazy(load)]),
);
const localPages = {
  papers: byName(import.meta.glob('../pages/papers/*.jsx')),
};

// Types that support Notion-rendered pages
const notionTypes = ['experiences', 'projects', 'papers'];

export default function PageRoutes() {
  const { type, id } = useParams();

  // Try local JS page first
  const Component = localPages[type]?.[id.toLowerCase()];
  if (Component) {
    return (
      <React.Suspense fallback={<h1>Loading...</h1>}>
        <Component />
      </React.Suspense>
    );
  }

  // Fall back to Notion-rendered page
  if (notionTypes.includes(type)) {
    return (
      <React.Suspense fallback={<h1>Loading...</h1>}>
        <NotionPage />
      </React.Suspense>
    );
  }

  return <h1>Page Not Found</h1>;
}
