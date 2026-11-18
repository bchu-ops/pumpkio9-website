import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import AppRoutes from './AppRoutes';
import LegacyPathRedirect, { canonicalPath } from './components/blocks/LegacyPathRedirect';

const stub = (name) => ({ default: () => <div>{name} page</div> });
vi.mock('./components/pages/Home', () => stub('home'));
vi.mock('./components/pages/Interests', () => stub('interests'));
vi.mock('./components/pages/Spotify', () => stub('spotify'));
vi.mock('./components/pages/Projects', () => stub('projects'));
vi.mock('./components/pages/NotFound', () => stub('notfound'));
vi.mock('@products/speeddemon/web/SpeedDemon', () => stub('speeddemon'));
vi.mock('@products/processlab/web/ProcessLab', () => stub('processlab'));
vi.mock('./components/blocks/PageRoutes', async () => {
  const { useParams } = await import('react-router-dom');
  function Detail() {
    const p = useParams();
    return <div>detail {p.type}/{p.id}</div>;
  }
  return { default: Detail };
});

function Where() {
  const l = useLocation();
  return <div data-testid="where">{l.pathname + l.search + l.hash}</div>;
}

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LegacyPathRedirect />
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

test.each([
  ['/interests', 'interests page'],
  ['/projects', 'projects page'],
  ['/spotify', 'spotify page'],
])('lowercase path %s renders its page', async (path, text) => {
  renderAt(path);
  expect(await screen.findByText(text)).toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent(path);
});

test.each([
  ['/Interests', '/interests', 'interests page'],
  ['/Projects', '/projects', 'projects page'],
  ['/Spotify', '/spotify', 'spotify page'],
  ['/Product2', '/spotify', 'spotify page'],
  ['/Interests/', '/interests', 'interests page'],
])('old path %s redirects to %s', async (from, to, text) => {
  renderAt(from);
  expect(await screen.findByText(text)).toBeInTheDocument();
  expect(screen.getByTestId('where').textContent).toBe(to);
});

test('redirect preserves search and hash', async () => {
  renderAt('/Projects?x=1&y=2#papers');
  expect(await screen.findByText('projects page')).toBeInTheDocument();
  expect(screen.getByTestId('where').textContent).toBe('/projects?x=1&y=2#papers');
});

test('Spotify OAuth callback at the registered /Spotify URI keeps code and state', async () => {
  renderAt('/Spotify?code=abc&state=xyz');
  expect(await screen.findByText('spotify page')).toBeInTheDocument();
  expect(screen.getByTestId('where').textContent).toBe('/spotify?code=abc&state=xyz');
});

test('/:type/:id detail routes still work and are not rewritten', async () => {
  renderAt('/projects/personal-website');
  expect(await screen.findByText('detail projects/personal-website')).toBeInTheDocument();
  expect(screen.getByTestId('where').textContent).toBe('/projects/personal-website');
});

test('unknown paths still reach the 404 page', async () => {
  renderAt('/nope');
  expect(await screen.findByText('notfound page')).toBeInTheDocument();
});

test('canonicalPath only rewrites known routes', () => {
  expect(canonicalPath('/interests')).toBeNull();
  expect(canonicalPath('/Interests')).toBe('/interests');
  expect(canonicalPath('/Speed-Demon')).toBeNull();
  expect(canonicalPath('/Projects/Foo')).toBeNull();
});
