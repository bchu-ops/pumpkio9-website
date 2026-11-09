import { useEffect, useState } from 'react';
import { openf1 } from './lib/openf1';
import { buildTrace, compareLaps, fastestLap, insights, miniSectors } from './lib/telemetry';

const GRID_POINTS = 600;
const MINI_SECTORS = 24;

/** Fastest lap per driver for a session, quickest first. */
export function rankDrivers(drivers, laps) {
  return drivers
    .map((d) => ({ ...d, best: fastestLap(laps.filter((l) => l.driver_number === d.driver_number)) }))
    .sort((x, y) => (x.best?.lap_duration ?? Infinity) - (y.best?.lap_duration ?? Infinity));
}

/** Loads drivers + every lap of a session once, so pickers can rank drivers. */
export function useSessionDrivers(sessionKey) {
  const [state, setState] = useState({ status: 'idle', drivers: [] });

  useEffect(() => {
    if (!sessionKey) return undefined;
    let cancelled = false;
    setState({ status: 'loading', drivers: [] });
    Promise.all([openf1.drivers(sessionKey), openf1.get('laps', { session_key: sessionKey })])
      .then(([drivers, laps]) => {
        if (!cancelled) setState({ status: 'ready', drivers: rankDrivers(drivers, laps) });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', drivers: [], error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey]);

  return state;
}

/** Loads both drivers' fastest-lap telemetry and compares them. */
export function useLapComparison(sessionKey, driverA, driverB) {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!sessionKey || !driverA?.best || !driverB?.best) return undefined;
    let cancelled = false;
    setState({ status: 'loading' });

    const load = async (driver) => {
      const lap = driver.best;
      const { car, location } = await openf1.lapTelemetry(sessionKey, driver.driver_number, lap);
      const trace = buildTrace(car, location, lap.date_start, lap.lap_duration);
      if (trace.length < 20) throw new Error(`Not enough telemetry for ${driver.name_acronym}'s lap`);
      return trace;
    };

    Promise.all([load(driverA), load(driverB)])
      .then(([traceA, traceB]) => {
        if (cancelled) return;
        const cmp = compareLaps(traceA, traceB, GRID_POINTS);
        const names = { a: driverA.name_acronym, b: driverB.name_acronym };
        setState({
          status: 'ready',
          cmp,
          sectors: miniSectors(cmp, MINI_SECTORS),
          notes: insights(cmp, names),
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error: error.message });
      });
    return () => { cancelled = true; };
  }, [sessionKey, driverA, driverB]);

  return state;
}
