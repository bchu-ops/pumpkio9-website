import React from 'react';
import { useParams } from 'react-router-dom';

const NotionPage = React.lazy(() => import('./NotionPage'));

// Map each type to require.context for local JS pages
const moduleContexts = {
  papers: require.context('../../components/pages/papers', false, /\.js$/),
  //projects: require.context('../../components/pages/projects', false, /\.js$/),
};

// Types that support Notion-rendered pages
const notionTypes = ['experiences', 'projects', 'papers'];

export default function PageRoutes() {
  const { type, id } = useParams();

  // Try local JS page first
  const context = moduleContexts[type];
  if (context) {
    const key = `./${id.toLowerCase()}.js`;
    if (context.keys().includes(key)) {
      const Component = React.lazy(() =>
        Promise.resolve({ default: context(key).default })
      );
      return (
        <React.Suspense fallback={<h1>Loading...</h1>}>
          <Component />
        </React.Suspense>
      );
    }
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
