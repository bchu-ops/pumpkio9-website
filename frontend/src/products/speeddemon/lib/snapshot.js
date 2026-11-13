// Data source for Speed Demon: static snapshot files first (built by
// scripts/prefetch-f1.mjs at deploy time), live OpenF1 API as fallback.

/** Turn a columnar snapshot lap back into OpenF1-shaped rows. */
export function decodeTelemetry(encoded) {
  const t0 = Date.parse(encoded.t0);
  const at = (ms) => new Date(t0 + ms).toISOString();
  const { car: c, loc: l } = encoded;
  return {
    car: c.ms.map((ms, i) => ({
      date: at(ms), speed: c.speed[i], throttle: c.throttle[i], brake: c.brake[i],
      n_gear: c.gear[i], rpm: c.rpm[i], drs: c.drs[i],
    })),
    location: l.ms.map((ms, i) => ({ date: at(ms), x: l.x[i], y: l.y[i] })),
  };
}

export function createDataSource({ base, fetchFn = (...a) => fetch(...a), api }) {
  const files = new Map();

  // Missing file or network error both mean "not in the snapshot".
  const file = (rel) => {
    if (!files.has(rel)) {
      files.set(rel, fetchFn(`${base}/${rel}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null));
    }
    return files.get(rel);
  };
  const optional = (p) => p.catch(() => []);

  return {
    async yearSessions(year) {
      const snap = (await file('index.json'))?.years?.[year];
      if (snap) return snap;
      const [meetings, sessions] = await Promise.all([api.meetings(year), api.get('sessions', { year })]);
      return { meetings, sessions };
    },

    async sessionMeta(sessionKey) {
      const snap = await file(`s/${sessionKey}.json`);
      if (snap) return snap;
      const [drivers, laps, stints, pits] = await Promise.all([
        api.drivers(sessionKey),
        api.get('laps', { session_key: sessionKey }),
        optional(api.get('stints', { session_key: sessionKey })),
        optional(api.get('pit', { session_key: sessionKey })),
      ]);
      return { drivers, laps, stints, pits };
    },

    async lapTelemetry(sessionKey, driverNumber, lap) {
      const snap = await file(`s/${sessionKey}/${driverNumber}-${lap.lap_number}.json`);
      return snap ? decodeTelemetry(snap) : api.lapTelemetry(sessionKey, driverNumber, lap);
    },
  };
}
