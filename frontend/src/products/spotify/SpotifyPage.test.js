import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SpotifyPage from './SpotifyPage';

jest.mock('../../App', () => ({ publicFile: (p) => `/${p}` }));

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
  process.env.REACT_APP_SPOTIFY_CLIENT_ID = clientId;
  return SpotifyPage;
}

function renderAt(Page, url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/Spotify" element={<><Page /><LocationSpy /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => DATA }));
});

afterEach(() => {
  delete process.env.REACT_APP_SPOTIFY_CLIENT_ID;
});

test('Mine tab shows synced plays, last-played time and favorites', async () => {
  renderAt(loadPage(''), '/Spotify');
  expect(await screen.findByText('Song One')).toBeInTheDocument();
  expect(screen.getByText('Song Two')).toBeInTheDocument();
  expect(screen.getByText(/Last song played/)).toHaveTextContent('5 min ago');
  expect(screen.getByText('Top Song')).toBeInTheDocument();
  expect(screen.getByText('Top Artist')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/spotify/listening.json');
});

test('Mine tab shows a friendly message when the JSON is missing', async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
  renderAt(loadPage(''), '/Spotify');
  expect(await screen.findByText(/isn't available right now/)).toBeInTheDocument();
});

test('time range switch changes favorites', async () => {
  renderAt(loadPage(''), '/Spotify');
  await screen.findByText('Top Song');
  fireEvent.click(screen.getByRole('button', { name: 'All time' }));
  expect(screen.queryByText('Top Song')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All time' })).toHaveAttribute('aria-pressed', 'true');
});

test('Yours tab explains when login is not configured', async () => {
  renderAt(loadPage(''), '/Spotify');
  fireEvent.click(screen.getByRole('button', { name: 'Yours' }));
  expect(screen.getByText(/isn't set up on this site yet/)).toBeInTheDocument();
});

test('Yours tab offers login and does not call Spotify until opened', async () => {
  renderAt(loadPage('cid'), '/Spotify');
  await screen.findByText('Song One');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Yours' }));
  expect(await screen.findByRole('button', { name: 'Log in with Spotify' })).toBeInTheDocument();
});

test('bad login callback shows error and clears code from URL', async () => {
  renderAt(loadPage('cid'), '/Spotify?code=abc&state=nope');
  expect(screen.getByRole('button', { name: 'Yours' })).toHaveAttribute('aria-pressed', 'true');
  expect(await screen.findByRole('alert')).toHaveTextContent(/did not match/);
  await waitFor(() => expect(lastLocation.search).toBe(''));
});

test('logged-in visitor not on allowlist sees guest list message', async () => {
  window.sessionStorage.setItem(
    'spotify.tokens',
    JSON.stringify({ accessToken: 'AT', refreshToken: 'RT', expiresAt: NOW + 3_600_000 }),
  );
  global.fetch = jest.fn(async (url) =>
    url.startsWith('https://api.spotify.com')
      ? { ok: false, status: 403, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => DATA },
  );
  renderAt(loadPage('cid'), '/Spotify');
  fireEvent.click(screen.getByRole('button', { name: 'Yours' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/Ask Brian to add yours/);
});
