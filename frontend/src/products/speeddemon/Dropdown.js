import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Styled select: a button that opens a listbox. Options can show a colour
 * swatch, a muted hint and a badge. Keyboard: ↑/↓, Home/End, Enter, Esc.
 * `searchable` adds a filter box for long lists (sessions, laps).
 * options: [{ value, label, hint?, swatch?, badge? }]
 */
export default function Dropdown({ label, value, options, onChange, disabled = false, searchable = false }) {
  const id = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = options.find((o) => String(o.value) === String(value));
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint || ''} ${o.badge || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o === selected)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (option) => {
    if (option) onChange(String(option.value));
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!searchable) listRef.current?.focus();
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, searchable]);

  const onListKey = (e) => {
    const last = shown.length - 1;
    const moves = {
      ArrowDown: () => setActive((a) => Math.min(last, a + 1)),
      ArrowUp: () => setActive((a) => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(shown[active]),
      Escape: () => close(),
      Tab: () => close(false),
    };
    if (moves[e.key]) {
      if (e.key !== 'Tab') e.preventDefault();
      moves[e.key]();
    }
  };

  const onButtonKey = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const listId = `${id}-list`;
  const optionId = (i) => `${id}-opt-${i}`;

  return (
    <div className={`sd-dd${open ? ' is-open' : ''}`} ref={rootRef}>
      <span className="sd-dd__label" id={`${id}-label`}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        className="sd-dd__button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
      >
        {selected?.swatch && <span className="sd-dd__swatch" style={{ background: selected.swatch }} />}
        <span className="sd-dd__value" id={`${id}-value`}>
          {selected ? selected.label : '—'}
          {selected?.hint && <span className="sd-dd__hint"> {selected.hint}</span>}
        </span>
        <svg className="sd-dd__chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" /></svg>
      </button>

      {open && (
        <div className="sd-dd__panel">
          {searchable && (
            <input
              type="search"
              className="sd-dd__search"
              placeholder="Type to filter…"
              aria-label={`Filter ${label}`}
              aria-controls={listId}
              aria-activedescendant={shown[active] ? optionId(active) : undefined}
              value={query}
              autoFocus
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onListKey}
            />
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={shown[active] ? optionId(active) : undefined}
            className="sd-dd__list"
            onKeyDown={onListKey}
          >
            {shown.map((o, i) => (
              <li
                key={o.value}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={o === selected}
                className={`sd-dd__option${i === active ? ' is-active' : ''}${o === selected ? ' is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o.swatch && <span className="sd-dd__swatch" style={{ background: o.swatch }} />}
                <span className="sd-dd__text">
                  <span className="sd-dd__name">{o.label}</span>
                  {o.hint && <span className="sd-dd__hint">{o.hint}</span>}
                </span>
                {o.badge && <span className="sd-dd__badge">{o.badge}</span>}
                {o === selected && (
                  <svg className="sd-dd__check" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3.2 3.2L15 7" /></svg>
                )}
              </li>
            ))}
            {!shown.length && <li className="sd-dd__empty" role="presentation">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
