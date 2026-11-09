import React, { useState } from 'react';
import { groupByDay, onRepeat, relativeTime } from './lib/format';

const RANGES = [
  { key: 'short_term', label: 'Last 4 weeks' },
  { key: 'medium_term', label: 'Last 6 months' },
  { key: 'long_term', label: 'All time' },
];
const RECENT_PREVIEW = 10;

function ExternalLink({ href, children, className }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Cover({ src, size = 48, round = false }) {
  return src ? (
    <img className={`sp-cover${round ? ' sp-cover--round' : ''}`} src={src} alt="" width={size} height={size} loading="lazy" />
  ) : (
    <span className={`sp-cover sp-cover--empty${round ? ' sp-cover--round' : ''}`} style={{ width: size, height: size }} aria-hidden="true" />
  );
}

function TrackRow({ track, meta }) {
  return (
    <li className="sp-row">
      <Cover src={track.album.image} />
      <div className="sp-row-text">
        <ExternalLink className="sp-row-title" href={track.url}>{track.name}</ExternalLink>
        <span className="sp-row-sub">{track.artists.map((a) => a.name).join(', ')}</span>
      </div>
      {meta && <span className="sp-row-meta">{meta}</span>}
    </li>
  );
}

function RecentlyPlayed({ plays, now }) {
  const [showAll, setShowAll] = useState(false);
  if (!plays.length) return <p className="sp-empty">No recent plays yet.</p>;
  const visible = showAll ? plays : plays.slice(0, RECENT_PREVIEW);
  return (
    <>
      {groupByDay(visible, now).map((group) => (
        <div key={group.label} className="sp-day">
          <h3 className="sp-day-label">{group.label}</h3>
          <ol className="sp-list">
            {group.plays.map((p) => (
              <TrackRow key={p.played_at} track={p.track} meta={<time dateTime={p.played_at}>{relativeTime(p.played_at, now)}</time>} />
            ))}
          </ol>
        </div>
      ))}
      {plays.length > RECENT_PREVIEW && (
        <button type="button" className="sp-link-button" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${plays.length}`}
        </button>
      )}
    </>
  );
}

function TopLists({ topTracks, topArtists }) {
  const [range, setRange] = useState('short_term');
  const tracks = topTracks[range] || [];
  const artists = topArtists[range] || [];
  return (
    <>
      <div className="sp-segmented" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="sp-columns">
        <div>
          <h3 className="sp-day-label">Top tracks</h3>
          <ol className="sp-list sp-list--numbered">
            {tracks.map((t, i) => <TrackRow key={t.id} track={t} meta={`#${i + 1}`} />)}
          </ol>
        </div>
        <div>
          <h3 className="sp-day-label">Top artists</h3>
          <ol className="sp-list">
            {artists.map((a, i) => (
              <li key={a.id} className="sp-row">
                <Cover src={a.image} round />
                <div className="sp-row-text">
                  <ExternalLink className="sp-row-title" href={a.url}>{a.name}</ExternalLink>
                </div>
                <span className="sp-row-meta">#{i + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

export default function ListeningView({ data, now = new Date() }) {
  const repeats = onRepeat(data.recent);
  return (
    <div className="sp-view">
      <p className="sp-asof">
        As of <time dateTime={data.generated_at}>{relativeTime(data.generated_at, now)}</time>
      </p>

      {repeats.length > 0 && (
        <section className="sp-section" aria-labelledby="sp-repeat">
          <h2 id="sp-repeat" className="sp-section-title">On repeat</h2>
          <ul className="sp-chips">
            {repeats.map(({ track, count }) => (
              <li key={track.id} className="sp-chip">
                <ExternalLink href={track.url}>{track.name}</ExternalLink>
                <span className="sp-chip-count">×{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sp-section" aria-labelledby="sp-recent">
        <h2 id="sp-recent" className="sp-section-title">Recently played</h2>
        <RecentlyPlayed plays={data.recent} now={now} />
      </section>

      <section className="sp-section" aria-labelledby="sp-top">
        <h2 id="sp-top" className="sp-section-title">Favorites</h2>
        <TopLists topTracks={data.top_tracks} topArtists={data.top_artists} />
      </section>
    </div>
  );
}
