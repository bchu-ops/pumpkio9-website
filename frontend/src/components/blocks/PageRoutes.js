import React from 'react';
import { useParams } from 'react-router-dom';
import NotionPage from './NotionPage';

// Map each type to require.context for local JS pages
const moduleContexts = {
  experiences: require.context('../pages/experiences', false, /\.js$/),
  projects: require.context('../pages/projects', false, /\.js$/),
  papers: require.context('../pages/papers', false, /\.js$/),
};

const VALID_TYPES = ['experiences', 'projects', 'papers'];

export default function PageRoutes() {
  const { type, id } = useParams();

  // Check for local JS page override first
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

  // Fall through to Notion-rendered page for valid types
  if (VALID_TYPES.includes(type)) {
    return <NotionPage />;
  }

  return <h1>Page Not Found</h1>;
}
