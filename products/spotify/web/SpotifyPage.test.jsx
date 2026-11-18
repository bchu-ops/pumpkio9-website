import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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

let lastLocation;
function LocationSpy() {
  lastLocation = useLocation();
  return null;
}

function loadPage(clientId) {
  vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', clientId);
  return SpotifyPage;
}

function renderAt(Page, url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/spotify" element={<><Page /><LocationSpy /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => DATA }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test('public page does not offer a visitor login', async () => {
  renderAt(loadPage('cid'), '/spotify');
  expect(await screen.findByText(/Last song played/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Invited' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Log in with Spotify' })).not.toBeInTheDocument();
  expect(screen.queryByText(/log in/i)).not.toBeInTheDocument();
});

test('Mine tab shows synced plays, last-played time and favorites', async () => {
  renderAt(loadPage(''), '/spotify');
  expect(await screen.findByText('Song One')).toBeInTheDocument();
  expect(screen.getByText('Song Two')).toBeInTheDocument();
  expect(screen.getByText(/Last song played/)).toHaveTextContent('5 min ago');
  expect(screen.getByText('Top Song')).toBeInTheDocument();
  expect(screen.getByText('Top Artist')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/spotify/listening.json');
});

test('Mine tab shows a friendly message when the JSON is missing', async () => {
  global.fetch = vi.fn(async () => ({ ok: false, status: 404 }));
  renderAt(loadPage(''), '/spotify');
  expect(await screen.findByText(/isn't available right now/)).toBeInTheDocument();
});

test('time range switch changes favorites', async () => {
  renderAt(loadPage(''), '/spotify');
  await screen.findByText('Top Song');
  fireEvent.click(screen.getByRole('button', { name: 'All time' }));
  expect(screen.queryByText('Top Song')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All time' })).toHaveAttribute('aria-pressed', 'true');
});

test('Invited tab explains when login is not configured', async () => {
  renderAt(loadPage(''), '/spotify?invited');
  fireEvent.click(screen.getByRole('button', { name: 'Invited' }));
  expect(screen.getByText(/isn't set up on this site yet/)).toBeInTheDocument();
});

test('Invited tab offers login and does not call Spotify until opened', async () => {
  renderAt(loadPage('cid'), '/spotify?invited');
  await screen.findByText('Song One');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Invited' }));
  expect(await screen.findByRole('button', { name: 'Log in with Spotify' })).toBeInTheDocument();
});

test('bad login callback shows error and clears code from URL', async () => {
  renderAt(loadPage('cid'), '/spotify?code=abc&state=nope');
  expect(screen.getByRole('button', { name: 'Invited' })).toHaveAttribute('aria-pressed', 'true');
  expect(await screen.findByRole('alert')).toHaveTextContent(/did not match/);
  await waitFor(() => expect(lastLocation.search).toBe(''));
});

test('logged-in account not on the invite list sees invite-only message', async () => {
  window.sessionStorage.setItem(
    'spotify.tokens',
    JSON.stringify({ accessToken: 'AT', refreshToken: 'RT', expiresAt: NOW + 3_600_000 }),
  );
  global.fetch = vi.fn(async (url) =>
    url.startsWith('https://api.spotify.com')
      ? { ok: false, status: 403, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => DATA },
  );
  renderAt(loadPage('cid'), '/spotify?invited');
  fireEvent.click(screen.getByRole('button', { name: 'Invited' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/isn't on the invite list/);
});
