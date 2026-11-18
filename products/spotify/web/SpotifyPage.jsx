import React, { useEffect, useState } from 'react';
import { publicFile } from '../../shared/publicFile';
import ListeningView from './ListeningView';
import './spotify.css';

// The snapshot is written by backend/automations/scripts/sync_spotify.py on each deploy.
function useListening() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    fetch(publicFile('spotify/listening.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => { alive = false; };
  }, []);
  return state;
}

function Status({ children }) {
  return <p className="sp-status" role="status">{children}</p>;
}

export default function SpotifyPage() {
  const state = useListening();

  return (
    <div className="sp-shell">
      <div className="sp-page">
        <h1 className="sp-title">Recent Songs</h1>
        <p className="sp-subtitle">What I've been listening to on Spotify</p>

        {state.status === 'loading' && <Status>Loading…</Status>}
        {state.status === 'error' && <Status>Listening data isn't available right now. Check back soon.</Status>}
        {state.status === 'ready' && <ListeningView data={state.data} />}
      </div>
    </div>
  );
}
