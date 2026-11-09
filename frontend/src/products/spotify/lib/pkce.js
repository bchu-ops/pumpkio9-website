// Spotify "Authorization Code with PKCE" login, entirely in the browser.
// No client secret: PKCE proves the token request came from the same
// browser that started the login. Tokens stay in sessionStorage, so they
// vanish when the tab closes.
// Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
/* global globalThis */

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
export const TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SCOPES = 'user-read-recently-played user-top-read';
const PENDING_KEY = 'spotify.pending';
const TOKENS_KEY = 'spotify.tokens';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const EXPIRY_MARGIN_MS = 60_000;

export function redirectUri(origin = window.location.origin) {
  return `${origin}${process.env.PUBLIC_URL || ''}/Spotify`;
}

export function randomString(length, cryptoObj = globalThis.crypto) {
  const bytes = cryptoObj.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
}

export function base64Url(bytes) {
  let binary = '';
  new Uint8Array(bytes).forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function challengeFrom(verifier, subtle = globalThis.crypto.subtle) {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(digest);
}

function read(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode): login still works for this page view.
  }
}

export async function buildLoginUrl({ clientId, storage, cryptoObj = globalThis.crypto, redirect = redirectUri() }) {
  const verifier = randomString(64, cryptoObj);
  const state = randomString(16, cryptoObj);
  write(storage, PENDING_KEY, { verifier, state });
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirect,
    code_challenge_method: 'S256',
    code_challenge: await challengeFrom(verifier, cryptoObj.subtle),
    state,
    scope: SCOPES,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

function saveTokens(storage, body, previous, now) {
  const tokens = {
    accessToken: body.access_token,
    // Spotify may skip sending a new refresh token; keep the old one then.
    refreshToken: body.refresh_token || previous?.refreshToken || null,
    expiresAt: now + body.expires_in * 1000,
  };
  write(storage, TOKENS_KEY, tokens);
  return tokens;
}

async function postToken(fetchImpl, params) {
  const resp = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!resp.ok) throw new Error(`Spotify login failed (${resp.status})`);
  return resp.json();
}

// Returns null when the URL has no login callback in it.
export async function completeLogin({ search, clientId, storage, fetchImpl = fetch, now = Date.now(), redirect = redirectUri() }) {
  const query = new URLSearchParams(search);
  if (!query.has('code') && !query.has('error')) return null;

  const pending = read(storage, PENDING_KEY);
  write(storage, PENDING_KEY, null);
  if (!pending || query.get('state') !== pending.state) {
    throw new Error('Login expired or did not match. Please try again.');
  }
  if (query.has('error')) {
    throw new Error(query.get('error') === 'access_denied' ? 'Login cancelled.' : 'Spotify login failed.');
  }
  const body = await postToken(fetchImpl, {
    grant_type: 'authorization_code',
    code: query.get('code'),
    redirect_uri: redirect,
    client_id: clientId,
    code_verifier: pending.verifier,
  });
  return saveTokens(storage, body, null, now);
}

// A valid access token, refreshed if needed, or null when logged out.
export async function getAccessToken({ clientId, storage, fetchImpl = fetch, now = Date.now() }) {
  const tokens = read(storage, TOKENS_KEY);
  if (!tokens) return null;
  if (tokens.expiresAt - EXPIRY_MARGIN_MS > now) return tokens.accessToken;
  if (!tokens.refreshToken) {
    logout(storage);
    return null;
  }
  try {
    const body = await postToken(fetchImpl, {
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: clientId,
    });
    return saveTokens(storage, body, tokens, now).accessToken;
  } catch {
    logout(storage);
    return null;
  }
}

export function logout(storage) {
  write(storage, TOKENS_KEY, null);
  write(storage, PENDING_KEY, null);
}
