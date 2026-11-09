import { useEffect, useState } from 'react';
import { openf1 } from './lib/openf1';
import { buildTrace, compareLaps, fastestLap, insights, miniSectors } from './lib/telemetry';
import { cornerReport, findCorners, narrative } from './lib/corners';

const GRID_POINTS = 600;
const MINI_SECTORS = 24;

/** Fastest lap per driver for a session, quickest first. */
export function rankDrivers(drivers, laps) {
  return drivers
    .map((d) => ({ ...d, best: fastestLap(laps.filter((l) => l.driver_number === d.driver_number)) }))
    .sort((x, y) => (x.best?.lap_duration ?? Infinity) - (y.best?.lap_duration ?? Infinity));
}

/** Drivers, every lap, tyre stints and pit stops for a session. */
export function useSessionDrivers(sessionKey) {
  const [state, setState] = useState({ status: 'idle', drivers: [], laps: [], stints: [], pits: [] });

  useEffect(() => {
    if (!sessionKey) return undefined;
    let cancelled = false;
    setState({ status: 'loading', drivers: [], laps: [], stints: [], pits: [] });
    const optional = (p) => p.catch(() => []); // tyre/pit data is a bonus, not required
    Promise.all([
      openf1.drivers(sessionKey),
      openf1.get('laps', { session_key: sessionKey }),
      optional(openf1.get('stints', { session_key: sessionKey })),
      optional(openf1.get('pit', { session_key: sessionKey })),
    ])
      .then(([drivers, laps, stints, pits]) => {
        if (!cancelled) setState({ status: 'ready', drivers: rankDrivers(drivers, laps), laps, stints, pits });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', drivers: [], laps: [], stints: [], pits: [], error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey]);

  return state;
}

/** Loads telemetry for one chosen lap per driver and compares them. */
export function useLapComparison(sessionKey, driverA, lapA, driverB, lapB) {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!sessionKey || !driverA || !driverB || !lapA || !lapB) return undefined;
    let cancelled = false;
    setState({ status: 'loading' });

    const load = async (driver, lap) => {
      const { car, location } = await openf1.lapTelemetry(sessionKey, driver.driver_number, lap);
      const trace = buildTrace(car, location, lap.date_start, lap.lap_duration);
      if (trace.length < 20) throw new Error(`Not enough telemetry for ${driver.name_acronym}'s lap ${lap.lap_number}`);
      return trace;
    };

    Promise.all([load(driverA, lapA), load(driverB, lapB)])
      .then(([traceA, traceB]) => {
        if (cancelled) return;
        const cmp = compareLaps(traceA, traceB, GRID_POINTS);
        const names = { a: driverA.name_acronym, b: driverB.name_acronym };
        const report = cornerReport(cmp, findCorners(cmp.a));
        setState({
          status: 'ready',
          cmp,
          sectors: miniSectors(cmp, MINI_SECTORS),
          notes: insights(cmp, names),
          corners: report,
          story: narrative(report, names),
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey, driverA, lapA, driverB, lapB]);

  return state;
}
