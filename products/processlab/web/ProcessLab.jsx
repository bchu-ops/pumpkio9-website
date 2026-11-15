import React, { useState } from 'react';
import LoopLab from './LoopLab';
import ThermoBuilder from './ThermoBuilder';
import Valves from './Valves';
import useFonts from '../../shared/useFonts';
import './ProcessLab.css';

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';

const TABS = [
  { id: 'loop', label: 'Loop Lab', Body: LoopLab },
  { id: 'builder', label: 'Thermo & Materials', Body: ThermoBuilder },
  { id: 'valves', label: 'Valves', Body: Valves },
];

/** Process Lab: header plus tabs. Each tab is an independent tool. */
export default function ProcessLab() {
  useFonts(FONTS);
  const [tab, setTab] = useState(TABS[0].id);
  const { Body } = TABS.find((t) => t.id === tab);
  return (
    <div className="cl-shell">
      <main className="cl-page">
        <header className="cl-header">
          <h1 className="cl-title">Process Lab</h1>
          <p className="cl-cred">Built by a chemical engineer (M.S. ChemE). Control theory, thermodynamics and materials in one place. Every model cites its source and is unit-tested against a known answer.</p>
        </header>
        <div className="cl-tabs" role="tablist" aria-label="Tools">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`cl-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="cl-sheet" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          <Body />
        </div>
      </main>
    </div>
  );
}
