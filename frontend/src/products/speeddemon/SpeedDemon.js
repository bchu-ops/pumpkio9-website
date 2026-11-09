import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FIRST_YEAR, defaultSession, useSessions } from './useSessions';
import { useLapComparison, useSessionDrivers } from './useLapComparison';
import { driverColors } from './lib/colors';
import LapSummary from './LapSummary';
import TrackMap from './TrackMap';
import TraceChart from './TraceChart';
import RacePace from './RacePace';
import CornerNotes from './CornerNotes';
import { cleanLaps } from './lib/race';
import { lapTime } from './lib/telemetry';
import './SpeedDemon.css';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - FIRST_YEAR + 1 }, (_, i) => THIS_YEAR - i);

function Select({ label, value, onChange, children, disabled }) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {children}
      </select>
    </label>
  );
}

// Timed laps (with a start time, so telemetry can be fetched) for one driver.
const lapsFor = (all, driver) => (driver
  ? cleanLaps(all.filter((l) => l.driver_number === driver.driver_number && l.date_start))
  : []);

const lapLabel = (l, best) => `Lap ${l.lap} · ${lapTime(l.time)}${l === best ? ' · fastest' : ''}${l.pitOut ? ' · pit out' : ''}${l.slow ? ' · slow' : ''}`;

function Status({ state, what }) {
  if (state.status === 'loading') return <p className="sd-status" role="status">Loading {what}…</p>;
  if (state.status === 'error') return <p className="sd-status sd-status--error" role="alert">Couldn't load {what}: {state.error}</p>;
  return null;
}

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
  const lapsA = useMemo(() => lapsFor(field.laps, driverA), [field.laps, driverA]);
  const lapsB = useMemo(() => lapsFor(field.laps, driverB), [field.laps, driverB]);
  const pickLap = (laps, key, driver) => laps.find((l) => String(l.lap) === params.get(key))?.raw || driver?.best;
  const lapA = pickLap(lapsA, 'la', driverA);
  const lapB = pickLap(lapsB, 'lb', driverB);
  const comparison = useLapComparison(session?.key, driverA, lapA, driverB, lapB);
  const [hover, setHover] = useState(null);
  const names = { a: driverA?.name_acronym, b: driverB?.name_acronym };

  const colors = useMemo(
    () => driverColors(driverA?.team_colour, driverB?.team_colour),
    [driverA, driverB]
  );
  const ready = comparison.status === 'ready';
  const cmp = comparison.cmp;
  const both = (key) => [
    { key: names.a, values: cmp.a.map((p) => p[key]), color: colors.a },
    { key: names.b, values: cmp.b.map((p) => p[key]), color: colors.b, dashed: true },
  ];

  return (
    <main className="sd">
      <header className="sd-hero">
        <p className="sd-eyebrow">🏎️ Product · Speed Demon</p>
        <h1>Lap telemetry explorer</h1>
        <p className="sd-lede">
          Pick any Formula 1 session, two drivers and any of their laps (fastest by default). The laps are
          lined up by track position so you can see where time was won and lost, corner by corner: braking
          points, apex speed and throttle, metre by metre. Data comes live from the open <a href="https://openf1.org" target="_blank" rel="noopener noreferrer">OpenF1 API</a>.
        </p>
      </header>

      <section className="sd-controls" aria-label="Choose a session and drivers">
        <Select label="Season" value={year} onChange={(v) => update({ year: v, event: null, a: null, b: null, la: null, lb: null })}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select label="Session" value={session?.key} disabled={!sessions.sessions.length} onChange={(v) => update({ event: v, a: null, b: null, la: null, lb: null })}>
          {sessions.sessions.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
        <Select label="Driver A" value={driverA?.driver_number} disabled={!withLaps.length} onChange={(v) => update({ a: v, la: null })}>
          {withLaps.map((d) => <option key={d.driver_number} value={d.driver_number}>{d.name_acronym} · {d.team_name}</option>)}
        </Select>
        <Select label={`${names.a || 'A'} lap`} value={lapA?.lap_number} disabled={!lapsA.length} onChange={(v) => update({ la: v })}>
          {lapsA.map((l) => <option key={l.lap} value={l.lap}>{lapLabel(l, lapsA.find((x) => x.raw === driverA?.best))}</option>)}
        </Select>
        <Select label="Driver B" value={driverB?.driver_number} disabled={!withLaps.length} onChange={(v) => update({ b: v, lb: null })}>
          {withLaps.map((d) => <option key={d.driver_number} value={d.driver_number}>{d.name_acronym} · {d.team_name}</option>)}
        </Select>
        <Select label={`${names.b || 'B'} lap`} value={lapB?.lap_number} disabled={!lapsB.length} onChange={(v) => update({ lb: v })}>
          {lapsB.map((l) => <option key={l.lap} value={l.lap}>{lapLabel(l, lapsB.find((x) => x.raw === driverB?.best))}</option>)}
        </Select>
      </section>

      <Status state={sessions} what="sessions" />
      <Status state={field} what="drivers" />
      <Status state={comparison} what="lap telemetry" />
      {sessions.status === 'ready' && !sessions.sessions.length && <p className="sd-status">No finished sessions for {year} yet.</p>}
      {field.status === 'ready' && withLaps.length < 2 && <p className="sd-status">This session has no timed laps to compare.</p>}

      {field.status === 'ready' && driverA && driverB && (
        <RacePace
          sides={[
            { key: 'a', name: names.a, color: colors.a, laps: lapsA, stints: field.stints.filter((x) => x.driver_number === driverA.driver_number), pits: field.pits.filter((x) => x.driver_number === driverA.driver_number) },
            { key: 'b', name: names.b, color: colors.b, dashed: true, laps: lapsB, stints: field.stints.filter((x) => x.driver_number === driverB.driver_number), pits: field.pits.filter((x) => x.driver_number === driverB.driver_number) },
          ]}
          selected={{ a: lapA?.lap_number, b: lapB?.lap_number }}
          onSelectLap={(side, lap) => update({ [side === 'a' ? 'la' : 'lb']: lap })}
        />
      )}

      {ready && (
        <>
          <LapSummary driverA={driverA} driverB={driverB} lapA={lapA} lapB={lapB} colors={colors} notes={comparison.notes} />
          <div className="sd-board">
            <TrackMap cmp={cmp} sectors={comparison.sectors} corners={comparison.corners} colors={colors} names={names} hoverIndex={hover} />
            <div className="sd-charts">
              <TraceChart
                title={`Gap (${names.b} to ${names.a})`} unit="s" zeroLine height={110}
                series={[{ key: 'Δ', values: cmp.delta, color: colors.b }]}
                hoverIndex={hover} onHover={setHover} format={(v) => (v >= 0 ? '+' : '') + v.toFixed(3)}
              />
              <TraceChart title="Speed" unit=" km/h" series={both('speed')} height={150} min={0} hoverIndex={hover} onHover={setHover} />
              <TraceChart title="Throttle" unit="%" series={both('throttle')} height={80} min={0} max={100} hoverIndex={hover} onHover={setHover} />
              <TraceChart title="Brake" unit="" series={both('brake')} height={50} min={0} max={100} step hoverIndex={hover} onHover={setHover} format={(v) => (v > 0 ? 'on' : 'off')} />
              <TraceChart title="Gear" unit="" series={both('gear')} height={80} min={1} max={8} step hoverIndex={hover} onHover={setHover} />
              <p className="sd-axis">
                {hover == null ? `Lap distance 0 – ${Math.round(cmp.length)} m · hover or tap a chart to scrub the lap` : `${Math.round(cmp.distance[hover])} m into the lap`}
              </p>
            </div>
          </div>
          <CornerNotes story={comparison.story} corners={comparison.corners} colors={colors} onFocusCorner={setHover} />
          <p className="sd-footnote">
            Laps are aligned by projecting {names.b}'s position onto {names.a}'s racing line. Telemetry is sampled
            about 4 times a second, so very short events (a quick lift) can be smoothed out.
          </p>
        </>
      )}
    </main>
  );
}
