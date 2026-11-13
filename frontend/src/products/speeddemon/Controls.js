import React from 'react';
import Dropdown from './Dropdown';
import { lapTime } from './lib/telemetry';

const lapOption = (l, best) => ({
  value: l.lap,
  label: `Lap ${l.lap}`,
  hint: lapTime(l.time),
  badge: l === best ? 'Fastest' : l.pitOut ? 'Pit out' : l.slow ? 'Slow' : undefined,
});

const driverOption = (d) => ({
  value: d.driver_number,
  label: d.name_acronym,
  hint: `${d.team_name} · ${lapTime(d.best?.lap_duration)}`,
  swatch: d.team_colour ? `#${d.team_colour}` : undefined,
});

function DriverPicker({ side, label, driver, laps, lap, field, onDriver, onLap }) {
  const best = laps.find((l) => l.raw === driver?.best);
  return (
    <>
      <Dropdown
        label={label} value={driver?.driver_number} searchable disabled={!field.length}
        options={field.map(driverOption)}
        onChange={onDriver}
      />
      <Dropdown
        label={`${driver?.name_acronym || side.toUpperCase()} lap`} value={lap?.lap_number} searchable disabled={!laps.length}
        options={laps.map((l) => lapOption(l, best))}
        onChange={onLap}
      />
    </>
  );
}

/** Season, session and up to three driver + lap pickers, plus quick actions. */
export default function Controls({ year, years, sessions, session, field, picks, update }) {
  const { a, b, c } = picks;
  const teammate = a.driver && field.find((d) => d.team_name === a.driver.team_name && d !== a.driver);
  const nextFree = field.find((d) => d !== a.driver && d !== b.driver);
  const reset = { a: null, b: null, c: null, la: null, lb: null, lc: null };

  return (
    <section className="sd-controls-wrap" aria-label="Choose a session and drivers">
      <div className="sd-controls">
        <Dropdown
          label="Season" value={year}
          options={years.map((y) => ({ value: y, label: String(y) }))}
          onChange={(v) => update({ year: v, event: null, ...reset })}
        />
        <div className="sd-controls__session">
          <Dropdown
            label="Session" value={session?.key} searchable disabled={!sessions.length}
            options={sessions.map((s) => ({ value: s.key, label: s.meeting, hint: s.name }))}
            onChange={(v) => update({ event: v, ...reset })}
          />
        </div>
        <DriverPicker side="a" label="Driver A" {...a} field={field} onDriver={(v) => update({ a: v, la: null })} onLap={(v) => update({ la: v })} />
        <DriverPicker side="b" label="Driver B" {...b} field={field} onDriver={(v) => update({ b: v, lb: null })} onLap={(v) => update({ lb: v })} />
        {c.driver && (
          <DriverPicker side="c" label="Driver C" {...c} field={field} onDriver={(v) => update({ c: v, lc: null })} onLap={(v) => update({ lc: v })} />
        )}
      </div>
      <div className="sd-actions">
        <button
          type="button" className="sd-chip" disabled={!teammate || teammate === b.driver}
          onClick={() => update({ b: teammate.driver_number, lb: null })}
          title={teammate ? `Compare ${a.driver.name_acronym} with teammate ${teammate.name_acronym}` : 'No teammate in this session'}
        >
          ⇄ Teammate{teammate ? ` (${teammate.name_acronym})` : ''}
        </button>
        {c.driver ? (
          <button type="button" className="sd-chip" onClick={() => update({ c: null, lc: null })}>✕ Remove driver C</button>
        ) : (
          <button type="button" className="sd-chip" disabled={!nextFree} onClick={() => update({ c: nextFree.driver_number, lc: null })}>
            ＋ Add a third driver
          </button>
        )}
      </div>
    </section>
  );
}
