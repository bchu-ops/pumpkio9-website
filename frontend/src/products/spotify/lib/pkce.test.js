/**
 * @jest-environment node
 */
import { webcrypto } from 'crypto';
import { buildLoginUrl, challengeFrom, completeLogin, getAccessToken, logout, TOKEN_URL } from './pkce';

// CRA's Jest 27 node environment predates globalThis.crypto; browsers have it.
beforeAll(() => {
  if (!globalThis.crypto) globalThis.crypto = webcrypto;
});

const REDIRECT = 'https://example.com/pumpkio9-website/Spotify';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

async function startLogin(storage) {
  const url = new URL(await buildLoginUrl({ clientId: 'cid', storage, redirect: REDIRECT }));
  return url.searchParams;
}

test('challenge matches the RFC 7636 example', async () => {
  expect(await challengeFrom('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  );
});

test('login URL carries PKCE params and no secret', async () => {
  const params = await startLogin(memoryStorage());
  expect(params.get('client_id')).toBe('cid');
  expect(params.get('response_type')).toBe('code');
  expect(params.get('code_challenge_method')).toBe('S256');
  expect(params.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(params.get('redirect_uri')).toBe(REDIRECT);
  expect(params.get('state')).toHaveLength(16);
  expect(params.has('client_secret')).toBe(false);
});

test('completeLogin returns null when URL has no callback', async () => {
  expect(await completeLogin({ search: '', clientId: 'cid', storage: memoryStorage(), fetchImpl: jest.fn(), redirect: REDIRECT })).toBeNull();
});

test('completeLogin rejects a state mismatch', async () => {
  const storage = memoryStorage();
  await startLogin(storage);
  await expect(
    completeLogin({ search: '?code=abc&state=wrong', clientId: 'cid', storage, fetchImpl: jest.fn(), redirect: REDIRECT }),
  ).rejects.toThrow(/did not match/);
});

test('completeLogin exchanges code with verifier, then token is reused', async () => {
  const storage = memoryStorage();
  const params = await startLogin(storage);
  const fetchImpl = jest.fn(async () => jsonResponse({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 }));

  const tokens = await completeLogin({
    search: `?code=abc&state=${params.get('state')}`,
    clientId: 'cid',
    storage,
    fetchImpl,
    now: 0,
    redirect: REDIRECT,
  });
  expect(tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT', expiresAt: 3_600_000 });

  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe(TOKEN_URL);
  const body = new URLSearchParams(init.body);
  expect(body.get('grant_type')).toBe('authorization_code');
  expect(body.get('code_verifier')).toHaveLength(64);
  expect(body.get('redirect_uri')).toBe(REDIRECT);

  expect(await getAccessToken({ clientId: 'cid', storage, fetchImpl, now: 1000 })).toBe('AT');
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test('completeLogin reports a cancelled login', async () => {
  const storage = memoryStorage();
  const params = await startLogin(storage);
  await expect(
    completeLogin({ search: `?error=access_denied&state=${params.get('state')}`, clientId: 'cid', storage, fetchImpl: jest.fn(), redirect: REDIRECT }),
  ).rejects.toThrow('Login cancelled.');
});

test('expired token refreshes and keeps old refresh token if none returned', async () => {
  const storage = memoryStorage();
  storage.setItem('spotify.tokens', JSON.stringify({ accessToken: 'OLD', refreshToken: 'RT', expiresAt: 0 }));
  const fetchImpl = jest.fn(async () => jsonResponse({ access_token: 'NEW', expires_in: 3600 }));

  expect(await getAccessToken({ clientId: 'cid', storage, fetchImpl, now: 10 })).toBe('NEW');
  const body = new URLSearchParams(fetchImpl.mock.calls[0][1].body);
  expect(body.get('grant_type')).toBe('refresh_token');
  expect(JSON.parse(storage.getItem('spotify.tokens')).refreshToken).toBe('RT');
});

test('failed refresh logs out', async () => {
  const storage = memoryStorage();
  storage.setItem('spotify.tokens', JSON.stringify({ accessToken: 'OLD', refreshToken: 'RT', expiresAt: 0 }));
  const fetchImpl = async () => jsonResponse({}, 400);
  expect(await getAccessToken({ clientId: 'cid', storage, fetchImpl, now: 10 })).toBeNull();
  expect(storage.getItem('spotify.tokens')).toBeNull();
});

test('logout clears tokens', () => {
  const storage = memoryStorage();
  storage.setItem('spotify.tokens', '{}');
  logout(storage);
  expect(storage.getItem('spotify.tokens')).toBeNull();
});
