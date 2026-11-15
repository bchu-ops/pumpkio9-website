import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 5; // px of travel before a press becomes a drag

/**
 * Pointer-event drag that works for mouse, pen and touch (HTML5 drag-and-drop
 * doesn't fire on touch screens). A press that never travels counts as a tap.
 * Escape cancels a drag in progress.
 */
export default function useDrag({ onDrop, onTap }) {
  const [drag, setDrag] = useState(null); // { payload, x, y } while dragging
  const handlers = useRef({ onDrop, onTap });
  handlers.current = { onDrop, onTap };
  const stopRef = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);

  const start = (payload) => (e) => {
    if (e.button !== 0) return;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let active = false;

    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('keydown', esc);
      stopRef.current = null;
      setDrag(null);
    };
    function move(ev) {
      if (!active && Math.hypot(ev.clientX - x0, ev.clientY - y0) < THRESHOLD) return;
      active = true;
      setDrag({ payload, x: ev.clientX, y: ev.clientY });
    }
    function up(ev) {
      stop();
      if (active) handlers.current.onDrop(payload, ev.clientX, ev.clientY);
      else handlers.current.onTap?.(payload);
    }
    function esc(ev) { if (ev.key === 'Escape') stop(); }

    stopRef.current?.();
    stopRef.current = stop;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('keydown', esc);
  };

  return { drag, start };
}
