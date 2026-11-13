import React, { useState } from 'react';
import { renderToCanvas, shareCanvas } from './lib/shareImage';

const LABEL = {
  idle: '📸 Copy as image',
  busy: 'Making image…',
  copied: '✓ Copied to clipboard',
  downloaded: '✓ Image downloaded',
  error: 'Couldn’t make image',
};

/** Turns the map + charts into a PNG (clipboard, or download as fallback). */
export default function ShareButton({ targetRef, title, fileName }) {
  const [state, setState] = useState('idle');

  const share = async () => {
    if (!targetRef.current || state === 'busy') return;
    setState('busy');
    try {
      const canvas = await renderToCanvas(targetRef.current, title);
      setState(await shareCanvas(canvas, fileName));
    } catch (err) {
      console.error('Share image failed:', err);
      setState('error');
    }
    setTimeout(() => setState('idle'), 2500);
  };

  return (
    <button type="button" className="sd-chip" onClick={share} disabled={state === 'busy'} aria-live="polite">
      {LABEL[state]}
    </button>
  );
}
