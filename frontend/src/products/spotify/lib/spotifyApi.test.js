import { fetchListening, pickImage, SpotifyApiError } from './spotifyApi';

const track = (id) => ({
  id,
  name: `Song ${id}`,
  duration_ms: 1000,
  external_urls: { spotify: `https://t/${id}` },
  artists: [{ name: 'A', external_urls: { spotify: 'https://a' } }],
  album: { name: 'Al', images: [{ url: 'big', width: 640 }, { url: 'mid', width: 300 }] },
});

function fakeFetch(status = 200) {
  return jest.fn(async (url) => {
    if (status !== 200) return { ok: false, status, json: async () => ({}) };
    let body;
    if (url.includes('recently-played')) {
      body = { items: [{ played_at: '2026-11-09T10:00:00Z', track: track('t1') }, { played_at: 'x', track: null }] };
    } else if (url.includes('/me/top/tracks')) {
      body = { items: [track('t2')] };
    } else {
      body = { items: [{ id: 'a1', name: 'Artist', images: [] }] };
    }
    return { ok: true, status: 200, json: async () => body };
  });
}

test('pickImage prefers smallest image at least 300px', () => {
  expect(pickImage([{ url: 'big', width: 640 }, { url: 'mid', width: 300 }])).toBe('mid');
  expect(pickImage([{ url: 's', width: 64 }])).toBe('s');
  expect(pickImage([])).toBeNull();
});

test('fetchListening matches the synced JSON shape', async () => {
  const fetchImpl = fakeFetch();
  const data = await fetchListening('AT', fetchImpl, new Date('2026-11-09T12:00:00Z'));
  expect(data.recent).toHaveLength(1);
  expect(data.recent[0].track.album.image).toBe('mid');
  expect(Object.keys(data.top_tracks)).toEqual(['short_term', 'medium_term', 'long_term']);
  expect(data.top_artists.long_term[0].name).toBe('Artist');
  expect(fetchImpl.mock.calls.every(([, init]) => init.headers.Authorization === 'Bearer AT')).toBe(true);
});

test('403 explains the guest list', async () => {
  const err = await fetchListening('AT', fakeFetch(403)).catch((e) => e);
  expect(err).toBeInstanceOf(SpotifyApiError);
  expect(err.status).toBe(403);
  expect(err.message).toMatch(/guest list/);
});
