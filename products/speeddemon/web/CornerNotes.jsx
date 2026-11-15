import React from 'react';

/** Race-engineer style notes, one row per corner. Hover/focus jumps the charts there. */
export default function CornerNotes({ story, corners, colors, onFocusCorner }) {
  if (!corners.length) return null;
  return (
    <section className="sd-corners" aria-label="Corner by corner">
      <h3>Corner by corner</h3>
      <p className="sd-corners__summary">{story.summary}</p>
      <ol className="sd-corners__list">
        {corners.map((c, i) => {
          const side = Math.abs(c.gain) < 0.01 ? null : c.gain > 0 ? 'a' : 'b';
          return (
            <li key={c.n}>
              <button
                type="button"
                className="sd-corners__item"
                style={{ borderColor: side ? colors[side] : 'transparent' }}
                onMouseEnter={() => onFocusCorner(c.apexIndex)}
                onFocus={() => onFocusCorner(c.apexIndex)}
                onClick={() => onFocusCorner(c.apexIndex)}
              >
                {story.corners[i]}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
