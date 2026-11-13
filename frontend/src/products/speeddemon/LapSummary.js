import React from 'react';
import { lapTime } from './lib/telemetry';

function DriverCard({ driver, lap, color, isFaster }) {
  const sectors = [lap.duration_sector_1, lap.duration_sector_2, lap.duration_sector_3];
  return (
    <div className="sd-driver" style={{ borderColor: color }}>
      <div className="sd-driver__name">
        <span className="sd-driver__swatch" style={{ background: color }} />
        <strong>{driver.name_acronym}</strong>
        <span className="sd-driver__team">{driver.full_name} · {driver.team_name}</span>
      </div>
      <div className="sd-driver__lap">
        {lapTime(lap.lap_duration)}
        {isFaster && <span className="sd-driver__badge">faster</span>}
      </div>
      <div className="sd-driver__sectors">
        {sectors.map((s, i) => (
          <span key={i}>S{i + 1} {s ? s.toFixed(3) : '—'}</span>
        ))}
        <span>Lap {lap.lap_number}</span>
      </div>
    </div>
  );
}

/** entries: [{ key, driver, lap, color }] for 2 or 3 drivers. */
export default function LapSummary({ entries, notes }) {
  const quickest = entries.reduce((q, e) => (e.lap.lap_duration < q.lap.lap_duration ? e : q));
  return (
    <section className={`sd-summary${entries.length > 2 ? ' sd-summary--three' : ''}`} aria-label="Lap summary">
      {entries.map((e) => (
        <DriverCard key={e.key} driver={e.driver} lap={e.lap} color={e.color} isFaster={e === quickest} />
      ))}
      <div className="sd-notes">
        <h3>What the data says</h3>
        <ul>
          {notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </section>
  );
}
