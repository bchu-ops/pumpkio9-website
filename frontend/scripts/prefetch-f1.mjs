// Pre-downloads recent F1 data from OpenF1 into public/f1 so Speed Demon's
// first load reads small static files instead of ~8 slow API calls.
// Runs in the deploy workflow before `npm run build`; output is not committed.
// Usage: node scripts/prefetch-f1.mjs [--meetings 2]
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.openf1.org/v1';
const FINAL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'f1');
// Build into a temp folder and swap at the end, so a failed run keeps the old snapshot.
const OUT = `${FINAL}.tmp`;
const MEETINGS = Number(process.argv[process.argv.indexOf('--meetings') + 1]) || 2;
const SESSION_NAMES = ['Qualifying', 'Race'];
const GAP_MS = 2100; // stay under OpenF1's free per-minute limit
const PAD_S = 0.5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));
let lastCall = 0;
let calls = 0;

async function api(endpoint, params) {
  const query = Object.entries(params)
    .map(([k, v]) => {
      const op = k.match(/[<>]=?$/)?.[0];
      const key = op ? k.slice(0, -op.length) : k;
      return `${key}${op ? (op.endsWith('=') ? op : `${op}=`) : '='}${encodeURIComponent(v)}`;
    })
    .join('&');
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    calls++;
    const res = await fetch(`${API}/${endpoint}?${query}`);
    if (res.ok) {
      const body = await res.json();
      if (!Array.isArray(body)) throw new Error(`${endpoint}: unexpected response`);
      return body;
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`${endpoint}: HTTP ${res.status}`);
    await sleep(5000 * (attempt + 1));
  }
  throw new Error(`${endpoint}: gave up after retries`);
}

const fastest = (laps) => laps
  .filter((l) => typeof l.lap_duration === 'number' && !l.is_pit_out_lap)
  .reduce((best, l) => (!best || l.lap_duration < best.lap_duration ? l : best), null);

// Columnar, offset-from-start encoding keeps each lap file small.
function encodeTelemetry(car, loc) {
  const t0 = Date.parse((car[0] || loc[0]).date);
  const ms = (rows) => rows.map((r) => Date.parse(r.date) - t0);
  const col = (rows, key) => rows.map((r) => r[key]);
  return {
    t0: new Date(t0).toISOString(),
    car: { ms: ms(car), speed: col(car, 'speed'), throttle: col(car, 'throttle'), brake: col(car, 'brake'), gear: col(car, 'n_gear'), rpm: col(car, 'rpm'), drs: col(car, 'drs') },
    loc: { ms: ms(loc), x: col(loc, 'x'), y: col(loc, 'y') },
  };
}

async function save(rel, data) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
}

async function main() {
  const now = Date.now();
  const year = new Date().getUTCFullYear();
  await rm(OUT, { recursive: true, force: true });

  const index = { generated: new Date().toISOString(), years: {} };
  for (const y of [year, year - 1]) {
    const [meetings, sessions] = await Promise.all([api('meetings', { year: y }), api('sessions', { year: y })]);
    index.years[y] = {
      meetings: meetings.map((m) => pick(m, ['meeting_key', 'meeting_name'])),
      sessions: sessions.map((s) => pick(s, ['session_key', 'meeting_key', 'session_name', 'location', 'date_start', 'date_end', 'is_cancelled'])),
    };
  }

  const finished = Object.values(index.years).flatMap((y) => y.sessions)
    .filter((s) => !s.is_cancelled && Date.parse(s.date_end) < now)
    .sort((a, b) => Date.parse(b.date_start) - Date.parse(a.date_start));
  const recentMeetings = [...new Set(finished.map((s) => s.meeting_key))].slice(0, MEETINGS);
  const targets = finished.filter((s) => recentMeetings.includes(s.meeting_key) && SESSION_NAMES.includes(s.session_name));
  index.cached = targets.map((s) => s.session_key);

  for (const s of targets) {
    const key = s.session_key;
    const [drivers, laps, stints, pits] = await Promise.all([
      api('drivers', { session_key: key }),
      api('laps', { session_key: key }),
      api('stints', { session_key: key }).catch(() => []),
      api('pit', { session_key: key }).catch(() => []),
    ]);
    await save(`s/${key}.json`, {
      drivers: drivers.map((d) => pick(d, ['driver_number', 'name_acronym', 'full_name', 'team_name', 'team_colour'])),
      laps: laps.map((l) => pick(l, ['driver_number', 'lap_number', 'date_start', 'lap_duration', 'duration_sector_1', 'duration_sector_2', 'duration_sector_3', 'is_pit_out_lap'])),
      stints: stints.map((x) => pick(x, ['driver_number', 'stint_number', 'lap_start', 'lap_end', 'compound', 'tyre_age_at_start'])),
      pits: pits.map((x) => pick(x, ['driver_number', 'lap_number', 'pit_duration'])),
    });

    for (const d of drivers) {
      const lap = fastest(laps.filter((l) => l.driver_number === d.driver_number));
      if (!lap?.date_start) continue;
      const start = Date.parse(lap.date_start);
      const window = {
        session_key: key,
        driver_number: d.driver_number,
        'date>=': new Date(start - PAD_S * 1000).toISOString(),
        'date<=': new Date(start + (lap.lap_duration + PAD_S) * 1000).toISOString(),
      };
      try {
        const car = await api('car_data', window);
        const loc = await api('location', window);
        if (car.length > 20) await save(`s/${key}/${d.driver_number}-${lap.lap_number}.json`, encodeTelemetry(car, loc));
      } catch (err) {
        console.warn(`skip ${key} #${d.driver_number}: ${err.message}`);
      }
    }
    console.log(`cached ${s.location} ${s.session_name} (${key})`);
  }

  await save('index.json', index);
  await rm(FINAL, { recursive: true, force: true });
  await rename(OUT, FINAL);
  console.log(`done: ${targets.length} sessions, ${calls} API calls`);
}

main().catch(async (err) => {
  // Never fail the deploy: the old snapshot (if any) stays, and the site falls back to the live API.
  console.error(`F1 prefetch failed: ${err.message}`);
  await rm(OUT, { recursive: true, force: true });
  process.exitCode = 0;
});
