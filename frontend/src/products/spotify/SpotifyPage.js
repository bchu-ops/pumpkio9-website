import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { publicFile } from '../../App';
import ListeningView from './ListeningView';
import { buildLoginUrl, completeLogin, getAccessToken, logout } from './lib/pkce';
import { fetchListening } from './lib/spotifyApi';
import './spotify.css';

// Read at call time (CRA still inlines it at build) so tests can set it.
const clientId = () => process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
}

function useBrianListening() {
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

// Runs once, the first time the "Yours" tab opens. The login code in the URL
// is single-use, so the ref keeps it from being exchanged twice.
function useVisitorListening(active, search, clearUrl) {
  const [state, setState] = useState({ status: 'idle' });
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current || !clientId()) return;
    started.current = true;
    (async () => {
      const store = storage();
      try {
        await completeLogin({ search, clientId: clientId(), storage: store });
        const token = await getAccessToken({ clientId: clientId(), storage: store });
        if (!token) return setState({ status: 'loggedOut' });
        setState({ status: 'ready', data: await fetchListening(token) });
      } catch (err) {
        setState({ status: 'error', message: err.message, forbidden: err.status === 403 });
      } finally {
        clearUrl();
      }
    })();
  }, [active, search, clearUrl]);

  return [state, setState];
}

function Status({ children }) {
  return <p className="sp-status" role="status">{children}</p>;
}

function BrianTab() {
  const state = useBrianListening();
  if (state.status === 'loading') return <Status>Loading…</Status>;
  if (state.status === 'error') return <Status>Listening data isn't available right now. Check back soon.</Status>;
  return <ListeningView data={state.data} />;
}

function VisitorTab({ state, setState }) {
  const login = async () => {
    window.location.assign(await buildLoginUrl({ clientId: clientId(), storage: storage() }));
  };
  const signOut = () => {
    logout(storage());
    setState({ status: 'loggedOut' });
  };

  if (!clientId()) return <Status>Spotify login isn't set up on this site yet.</Status>;
  if (state.status === 'idle' || state.status === 'loading') return <Status>Loading your Spotify…</Status>;

  if (state.status === 'loggedOut' || state.status === 'error') {
    return (
      <div className="sp-login">
        {state.status === 'error' && (
          <p className="sp-error" role="alert">
            {state.message}
            {state.forbidden && ' Spotify only lets small hobby apps like this one work for a few invited accounts. Ask Brian to add yours.'}
          </p>
        )}
        <p>
          See your own recently played tracks and favorites. Your data stays in this browser tab and is
          never sent to my site. Spotify only allows a few invited accounts for hobby apps, so ask me first.
        </p>
        <button type="button" className="sp-button" onClick={login}>Log in with Spotify</button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="sp-link-button sp-logout" onClick={signOut}>Log out</button>
      <ListeningView data={state.data} />
    </>
  );
}

export default function SpotifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returningFromLogin = /[?&](code|error)=/.test(location.search);
  const [tab, setTab] = useState(returningFromLogin ? 'you' : 'brian');
  // Drop ?code&state from the address bar and history once handled.
  const clearUrl = useRef(() => {
    if (returningFromLogin) navigate('/Spotify', { replace: true });
  }).current;
  const [visitor, setVisitor] = useVisitorListening(tab === 'you', location.search, clearUrl);

  return (
    <div className="sp-shell">
      <div className="sp-page">
        <h1 className="sp-title">Recent Songs</h1>
        <p className="sp-subtitle">What I've been listening to on Spotify</p>

        <div className="sp-segmented sp-tabs" role="group" aria-label="Whose listening">
          <button type="button" aria-pressed={tab === 'brian'} onClick={() => setTab('brian')}>Mine</button>
          <button type="button" aria-pressed={tab === 'you'} onClick={() => setTab('you')}>Yours</button>
        </div>

        {tab === 'brian' ? <BrianTab /> : <VisitorTab state={visitor} setState={setVisitor} />}
      </div>
    </div>
  );
}
