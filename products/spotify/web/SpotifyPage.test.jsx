import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpotifyPage from './SpotifyPage';

vi.mock('../../shared/publicFile', () => ({ publicFile: (p) => `/${p}` }));

const NOW = Date.now();
const track = (id, name) => ({
  id,
  name,
  url: 'https://open.spotify.com/track/x',
  duration_ms: 1,
  artists: [{ name: 'Band', url: null }],
  album: { name: 'A', image: null, url: null },
});
const DATA = {
  generated_at: new Date(NOW).toISOString(),
  recent: [
    { played_at: new Date(NOW - 5 * 60_000).toISOString(), track: track('t1', 'Song One') },
    { played_at: new Date(NOW - 9 * 60_000).toISOString(), track: track('t2', 'Song Two') },
  ],
  top_tracks: { short_term: [track('t3', 'Top Song')], medium_term: [], long_term: [] },
  top_artists: { short_term: [{ id: 'a', name: 'Top Artist', url: null, image: null }], medium_term: [], long_term: [] },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/spotify']}>
      <SpotifyPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => DATA }));
});

test('shows synced plays, last-played time and favorites', async () => {
  renderPage();
  expect(await screen.findByText('Song One')).toBeInTheDocument();
  expect(screen.getByText('Song Two')).toBeInTheDocument();
  expect(screen.getByText(/Last song played/)).toHaveTextContent('5 min ago');
  expect(screen.getByText('Top Song')).toBeInTheDocument();
  expect(screen.getByText('Top Artist')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/spotify/listening.json');
});

test('has no login or account tabs', async () => {
  renderPage();
  await screen.findByText('Song One');
  expect(screen.queryByRole('button', { name: 'Invited' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
});

test('shows a loading message before the data arrives', () => {
  global.fetch = vi.fn(() => new Promise(() => {}));
  renderPage();
  expect(screen.getByRole('status')).toHaveTextContent('Loading');
});

test('shows a friendly message when the JSON is missing', async () => {
  global.fetch = vi.fn(async () => ({ ok: false, status: 404 }));
  renderPage();
  expect(await screen.findByText(/isn't available right now/)).toBeInTheDocument();
});

test('time range switch changes favorites', async () => {
  renderPage();
  await screen.findByText('Top Song');
  fireEvent.click(screen.getByRole('button', { name: 'All time' }));
  expect(screen.queryByText('Top Song')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All time' })).toHaveAttribute('aria-pressed', 'true');
});
