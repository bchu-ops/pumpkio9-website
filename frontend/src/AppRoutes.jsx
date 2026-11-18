import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PageRoutes from './components/blocks/PageRoutes';

const Home = lazy(() => import('./components/pages/Home'));
const Spotify = lazy(() => import('./components/pages/Spotify'));
const Interests = lazy(() => import('./components/pages/Interests'));
const SpeedDemon = lazy(() => import('@products/speeddemon/web/SpeedDemon'));
const ProcessLab = lazy(() => import('@products/processlab/web/ProcessLab'));
const Projects = lazy(() => import('./components/pages/Projects'));
const NotFound = lazy(() => import('./components/pages/NotFound'));

// Route paths are lowercase kebab-case. Old capitalised URLs (and /Product2)
// are rewritten to these by LegacyPathRedirect.
export default function AppRoutes() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interests" element={<Interests />} />
        <Route path="/spotify" element={<Spotify />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/speed-demon" element={<SpeedDemon />} />
        <Route path="/process-lab" element={<ProcessLab />} />

        {/* Dynamic route for all types (papers, projects, tutorials, etc) */}
        <Route path="/:type/:id" element={<PageRoutes />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
