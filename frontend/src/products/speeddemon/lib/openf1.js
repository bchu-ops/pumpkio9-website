// Small client for the public OpenF1 REST API (https://openf1.org).
// Historical data is free, needs no key, and allows browser requests (CORS *).

import { lapWindow } from './telemetry';

const BASE = 'https://api.openf1.org/v1';
const MAX_CONCURRENT = 2; // stay well under OpenF1's free rate limit
const STORAGE_PREFIX = 'openf1:';

// Keys may carry an operator (e.g. "date>="), which OpenF1 reads literally.
export function buildUrl(path, params = {}) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const op = k.match(/[<>]=?$/)?.[0];
      const key = op ? k.slice(0, -op.length) : k;
      const sep = op ? (op.endsWith('=') ? op : `${op}=`) : '=';
      return `${key}${sep}${encodeURIComponent(v)}`;
    })
    .join('&');
  return `${BASE}/${path}${query ? `?${query}` : ''}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeStorage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function createClient({
  fetchFn = (...args) => fetch(...args),
  storage = safeStorage(),
  retryDelayMs = 1500,
} = {}) {
  const memory = new Map();
  const waiting = [];
  let active = 0;

  const runQueued = (task) => new Promise((resolve, reject) => {
    waiting.push({ task, resolve, reject });
    pump();
  });

  function finished() {
    active -= 1;
    pump();
  }

  function start({ task, resolve, reject }) {
    active += 1;
    task().then(resolve, reject).finally(finished);
  }

  function pump() {
    while (active < MAX_CONCURRENT && waiting.length) start(waiting.shift());
  }

  async function request(url, attempt = 0) {
    const res = await fetchFn(url);
    if ((res.status === 429 || res.status >= 500) && attempt === 0) {
      await sleep(retryDelayMs);
      return request(url, 1);
    }
    if (!res.ok) throw new Error(`OpenF1 request failed (${res.status})`);
    const body = await res.json();
    if (!Array.isArray(body)) throw new Error('OpenF1 sent an unexpected response');
    return body;
  }

  function readStored(url) {
    try {
      const raw = storage?.getItem(STORAGE_PREFIX + url);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeStored(url, data) {
    try {
      storage?.setItem(STORAGE_PREFIX + url, JSON.stringify(data));
    } catch {
      // Storage full or blocked: memory cache still works for this visit.
    }
  }

  function get(path, params) {
    const url = buildUrl(path, params);
    if (memory.has(url)) return memory.get(url);
    const stored = readStored(url);
    if (stored) {
      const hit = Promise.resolve(stored);
      memory.set(url, hit);
      return hit;
    }
    const pending = runQueued(() => request(url)).then((data) => {
      writeStored(url, data);
      return data;
    });
    pending.catch(() => memory.delete(url)); // let a failed request be retried
    memory.set(url, pending);
    return pending;
  }

  return {
    get,
    meetings: (year) => get('meetings', { year }),
    sessions: (meetingKey) => get('sessions', { meeting_key: meetingKey }),
    drivers: (sessionKey) => get('drivers', { session_key: sessionKey }),
    laps: (sessionKey, driverNumber) => get('laps', { session_key: sessionKey, driver_number: driverNumber }),
    async lapTelemetry(sessionKey, driverNumber, lap) {
      const { start, end } = lapWindow(lap);
      const params = { session_key: sessionKey, driver_number: driverNumber, 'date>=': start, 'date<=': end };
      const [car, location] = await Promise.all([get('car_data', params), get('location', params)]);
      return { car, location };
    },
  };
}

export const openf1 = createClient();
