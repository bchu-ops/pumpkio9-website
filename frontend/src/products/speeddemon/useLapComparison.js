import { useEffect, useState } from 'react';
import { f1data } from './data';
import { buildTrace, compareLaps, fastestLap, insights, sectorWinners } from './lib/telemetry';
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
    f1data.sessionMeta(sessionKey)
      .then(({ drivers, laps, stints = [], pits = [] }) => {
        if (!cancelled) setState({ status: 'ready', drivers: rankDrivers(drivers, laps), laps, stints, pits });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', drivers: [], laps: [], stints: [], pits: [], error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey]);

  return state;
}

/**
 * Loads telemetry for one chosen lap per driver and compares them against A.
 * C is optional: it gets its own comparison against A (cmpC).
 */
export function useLapComparison(sessionKey, driverA, lapA, driverB, lapB, driverC = null, lapC = null) {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!sessionKey || !driverA || !driverB || !lapA || !lapB) return undefined;
    let cancelled = false;
    setState({ status: 'loading' });

    const load = async (driver, lap) => {
      const { car, location } = await f1data.lapTelemetry(sessionKey, driver.driver_number, lap);
      const trace = buildTrace(car, location, lap.date_start, lap.lap_duration);
      if (trace.length < 20) throw new Error(`Not enough telemetry for ${driver.name_acronym}'s lap ${lap.lap_number}`);
      return trace;
    };

    const withC = Boolean(driverC && lapC);
    Promise.all([load(driverA, lapA), load(driverB, lapB), withC ? load(driverC, lapC) : null])
      .then(([traceA, traceB, traceC]) => {
        if (cancelled) return;
        const cmp = compareLaps(traceA, traceB, GRID_POINTS);
        const cmpC = traceC ? compareLaps(traceA, traceC, GRID_POINTS) : null;
        const names = { a: driverA.name_acronym, b: driverB.name_acronym };
        const report = cornerReport(cmp, findCorners(cmp.a));
        setState({
          status: 'ready',
          cmp,
          cmpC,
          sectors: sectorWinners(cmpC ? { a: cmp.a, b: cmp.b, c: cmpC.b } : { a: cmp.a, b: cmp.b }, MINI_SECTORS),
          notes: insights(cmp, names),
          corners: report,
          story: narrative(report, names),
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey, driverA, lapA, driverB, lapB, driverC, lapC]);

  return state;
}
