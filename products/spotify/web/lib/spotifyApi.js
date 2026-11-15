// Reads a logged-in visitor's listening data straight from the Web API and
// shapes it like frontend/public/spotify/listening.json (sync_spotify.py),
// so one view renders both.

const API_URL = 'https://api.spotify.com/v1';
export const TIME_RANGES = ['short_term', 'medium_term', 'long_term'];
const RECENT_LIMIT = 50;
const TOP_LIMIT = 10;

export class SpotifyApiError extends Error {
  constructor(status) {
    super(
      status === 403
        ? 'This Spotify account is not on the guest list yet.'
        : status === 429
          ? 'Spotify is rate limiting right now. Try again in a minute.'
          : `Spotify request failed (${status}).`,
    );
    this.status = status;
  }
}

export function pickImage(images, target = 300) {
  if (!images?.length) return null;
  const bySize = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  return (bySize.find((i) => (i.width || 0) >= target) || bySize[bySize.length - 1]).url;
}

export function toTrack(raw) {
  const album = raw.album || {};
  return {
    id: raw.id,
    name: raw.name,
    url: raw.external_urls?.spotify || null,
    duration_ms: raw.duration_ms || 0,
    artists: (raw.artists || []).map((a) => ({ name: a.name, url: a.external_urls?.spotify || null })),
    album: { name: album.name || '', image: pickImage(album.images), url: album.external_urls?.spotify || null },
  };
}

export function toArtist(raw) {
  return { id: raw.id, name: raw.name, url: raw.external_urls?.spotify || null, image: pickImage(raw.images) };
}

export async function fetchListening(accessToken, fetchImpl = fetch, now = new Date()) {
  const get = async (path) => {
    const resp = await fetchImpl(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) throw new SpotifyApiError(resp.status);
    return resp.json();
  };
  const byRange = async (type, shape) => {
    const pages = await Promise.all(
      TIME_RANGES.map((r) => get(`/me/top/${type}?time_range=${r}&limit=${TOP_LIMIT}`)),
    );
    return Object.fromEntries(TIME_RANGES.map((r, i) => [r, pages[i].items.map(shape)]));
  };

  const [recent, topTracks, topArtists] = await Promise.all([
    get(`/me/player/recently-played?limit=${RECENT_LIMIT}`),
    byRange('tracks', toTrack),
    byRange('artists', toArtist),
  ]);
  return {
    generated_at: now.toISOString(),
    recent: recent.items.filter((i) => i.track?.id).map((i) => ({ played_at: i.played_at, track: toTrack(i.track) })),
    top_tracks: topTracks,
    top_artists: topArtists,
  };
}
