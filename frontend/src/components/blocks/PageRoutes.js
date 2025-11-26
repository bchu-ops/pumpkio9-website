import React from 'react';
import { useParams } from 'react-router-dom';

// Map each type to require.context
const moduleContexts = {
  papers: require.context('../../components/pages/papers', false, /\.js$/),
  projects: require.context('../../components/pages/projects', false, /\.js$/),
};

export default function PageRoutes() {
  const { type, id } = useParams();
  const context = moduleContexts[type];

  if (!context) return <h1>Type Not Found</h1>;

  const key = `./${id.toLowerCase()}.js`;
  if (!context.keys().includes(key)) return <h1>Page Not Found</h1>;

  const Component = React.lazy(() =>
    Promise.resolve({ default: context(key).default })
  );

  return (
    <React.Suspense fallback={<h1>Loading...</h1>}>
      <Component />
    </React.Suspense>
  );
}
