import React from 'react';
import { MiniSymbol } from './BlockDiagram';
import { UNIT_TYPES } from './lib/units';

/**
 * Equipment palette. Drag an item onto the line, or tap / press Enter to add it
 * after the selected block. While a block is being dragged, the palette becomes
 * the place to drop it to remove it.
 */
const Palette = React.forwardRef(function Palette({ types, removing, armed, onStart, onAdd }, ref) {
  const keyAdd = (payload) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd(payload); }
  };
  const items = [...types.map((type) => ({ kind: 'add', type, label: UNIT_TYPES[type].label })), { kind: 'pid', type: 'pid', label: 'PID loop' }];

  return (
    <div ref={ref} className={`pb-palette${removing ? ' is-bin' : ''}${armed ? ' is-armed' : ''}`} role="group" aria-label="Equipment">
      {removing ? (
        <p className="pb-bin">Drop here to remove</p>
      ) : items.map((it) => (
        <button
          key={it.type}
          type="button"
          className="pb-item"
          aria-label={it.kind === 'pid' ? 'Add a PID loop on the selected block' : `Add ${it.label.toLowerCase()} after the selected block`}
          onPointerDown={onStart(it)}
          onKeyDown={keyAdd(it)}
        >
          <MiniSymbol type={it.type} />
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
});

export default Palette;
