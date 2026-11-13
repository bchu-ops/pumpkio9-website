import React from 'react';

const ICON = { ready: '✓', loading: '', error: '!', idle: '' };

/** Step-by-step progress: what's done, what's loading, what failed. */
export function LoadingSteps({ steps }) {
  const visible = steps.filter((s) => s.state.status !== 'idle');
  if (visible.every((s) => s.state.status === 'ready')) return null;
  return (
    <ol className="sd-steps" aria-live="polite">
      {visible.map(({ label, state }) => (
        <li key={label} className={`sd-steps__item is-${state.status}`}>
          <span className="sd-steps__icon" aria-hidden="true">{ICON[state.status]}</span>
          <span>
            {label}
            {state.status === 'error' && <span className="sd-steps__error">: {state.error}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Grey placeholders in the shape of the summary, map and charts. */
export function SkeletonBoard() {
  return (
    <div className="sd-skeleton" aria-hidden="true">
      <div className="sd-skeleton__row">
        <div className="sd-skel sd-skel--card" />
        <div className="sd-skel sd-skel--card" />
        <div className="sd-skel sd-skel--card sd-skel--wide" />
      </div>
      <div className="sd-board">
        <div className="sd-skel sd-skel--map" />
        <div className="sd-charts">
          {[110, 150, 80, 50, 80].map((h, i) => <div key={i} className="sd-skel" style={{ height: h + 28 }} />)}
        </div>
      </div>
    </div>
  );
}
