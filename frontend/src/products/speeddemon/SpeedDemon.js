import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FIRST_YEAR, defaultSession, useSessions } from './useSessions';
import { useLapComparison, useSessionDrivers } from './useLapComparison';
import { driverColors } from './lib/colors';
import { cleanLaps } from './lib/race';
import Controls from './Controls';
import Charts from './Charts';
import LapSummary from './LapSummary';
import TrackMap from './TrackMap';
import RacePace from './RacePace';
import CornerNotes from './CornerNotes';
import ShareButton from './ShareButton';
import { LoadingSteps, SkeletonBoard } from './Loading';
import './SpeedDemon.css';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - FIRST_YEAR + 1 }, (_, i) => THIS_YEAR - i);

// Timed laps (with a start time, so telemetry can be fetched) for one driver.
const lapsFor = (all, driver) => (driver
  ? cleanLaps(all.filter((l) => l.driver_number === driver.driver_number && l.date_start))
  : []);

const forDriver = (rows, driver) => rows.filter((x) => x.driver_number === driver.driver_number);

export default function SpeedDemon() {
  const [params, setParams] = useSearchParams();
  const year = Number(params.get('year')) || THIS_YEAR;
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  const sessions = useSessions(year);
  const session = sessions.sessions.find((s) => String(s.key) === params.get('event')) || defaultSession(sessions.sessions);
  const field = useSessionDrivers(session?.key);
  const withLaps = field.drivers.filter((d) => d.best);
  const pick = (key, fallback) => withLaps.find((d) => String(d.driver_number) === params.get(key)) || fallback;
  const driverA = pick('a', withLaps[0]);
  const driverB = pick('b', withLaps.find((d) => d !== driverA));
  const driverC = params.get('c') ? pick('c', null) : null;

  const lapsA = useMemo(() => lapsFor(field.laps, driverA), [field.laps, driverA]);
  const lapsB = useMemo(() => lapsFor(field.laps, driverB), [field.laps, driverB]);
  const lapsC = useMemo(() => lapsFor(field.laps, driverC), [field.laps, driverC]);
  const pickLap = (laps, key, driver) => laps.find((l) => String(l.lap) === params.get(key))?.raw || driver?.best;
  const lapA = pickLap(lapsA, 'la', driverA);
  const lapB = pickLap(lapsB, 'lb', driverB);
  const lapC = pickLap(lapsC, 'lc', driverC);

  const comparison = useLapComparison(session?.key, driverA, lapA, driverB, lapB, driverC, lapC);
  const [hover, setHover] = useState(null);
  const boardRef = useRef(null);

  const names = { a: driverA?.name_acronym, b: driverB?.name_acronym, ...(driverC ? { c: driverC.name_acronym } : {}) };
  const colors = useMemo(
    () => driverColors(driverA?.team_colour, driverB?.team_colour, driverC ? driverC.team_colour ?? null : undefined),
    [driverA, driverB, driverC]
  );
  const ready = comparison.status === 'ready';
  const { cmp, cmpC } = comparison;
  const entries = [
    { key: 'a', driver: driverA, lap: lapA, laps: lapsA },
    { key: 'b', driver: driverB, lap: lapB, laps: lapsB },
    ...(driverC ? [{ key: 'c', driver: driverC, lap: lapC, laps: lapsC }] : []),
  ].filter((e) => e.driver);

  return (
    <main className="sd">
      <header className="sd-hero">
        <p className="sd-eyebrow">🏎️ Product · Speed Demon</p>
        <h1>Lap telemetry explorer</h1>
        <p className="sd-lede">
          Pick any Formula 1 session, up to three drivers and any of their laps (fastest by default). The laps are
          lined up by track position so you can see where time was won and lost, corner by corner: braking
          points, apex speed and throttle, metre by metre. Data comes from the open <a href="https://openf1.org" target="_blank" rel="noopener noreferrer">OpenF1 API</a>.
        </p>
      </header>

      <Controls
        year={year} years={YEARS} sessions={sessions.sessions} session={session} field={withLaps}
        picks={{
          a: { driver: driverA, laps: lapsA, lap: lapA },
          b: { driver: driverB, laps: lapsB, lap: lapB },
          c: { driver: driverC, laps: lapsC, lap: lapC },
        }}
        update={update}
      />

      <LoadingSteps
        steps={[
          { label: 'Season calendar', state: sessions },
          { label: 'Drivers, laps and tyres', state: field },
          { label: `Telemetry for ${Object.values(names).filter(Boolean).join(', ') || 'drivers'}`, state: comparison },
        ]}
      />
      {sessions.status === 'ready' && !sessions.sessions.length && <p className="sd-status">No finished sessions for {year} yet.</p>}
      {field.status === 'ready' && withLaps.length < 2 && <p className="sd-status">This session has no timed laps to compare.</p>}

      {field.status === 'ready' && entries.length >= 2 && (
        <RacePace
          sides={entries.map((e) => ({
            key: e.key, name: e.driver.name_acronym, color: colors[e.key], dashed: e.key !== 'a',
            laps: e.laps, stints: forDriver(field.stints, e.driver), pits: forDriver(field.pits, e.driver),
          }))}
          selected={Object.fromEntries(entries.map((e) => [e.key, e.lap?.lap_number]))}
          onSelectLap={(side, lap) => update({ [`l${side}`]: lap })}
        />
      )}

      {comparison.status === 'loading' && <SkeletonBoard />}

      {ready && (
        <>
          <LapSummary entries={entries.map((e) => ({ ...e, color: colors[e.key] }))} notes={comparison.notes} />
          <div className="sd-board-head">
            <ShareButton
              targetRef={boardRef}
              title={`${Object.values(names).join(' vs ')} · ${session?.label || ''}`}
              fileName={`speed-demon-${Object.values(names).join('-').toLowerCase()}.png`}
            />
          </div>
          <div className="sd-board" ref={boardRef}>
            <TrackMap cmp={cmp} cmpC={cmpC} sectors={comparison.sectors} corners={comparison.corners} colors={colors} names={names} hoverIndex={hover} />
            <Charts cmp={cmp} cmpC={cmpC} names={names} colors={colors} hover={hover} onHover={setHover} />
          </div>
          <CornerNotes story={comparison.story} corners={comparison.corners} colors={colors} onFocusCorner={setHover} />
          <p className="sd-footnote">
            Laps are aligned by projecting each driver's position onto {names.a}'s racing line. Corner notes compare
            {` ${names.a} and ${names.b}`}. Telemetry is sampled about 4 times a second, so very short events (a quick
            lift) can be smoothed out.
          </p>
        </>
      )}
    </main>
  );
}
