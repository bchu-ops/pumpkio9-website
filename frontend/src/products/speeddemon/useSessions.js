import { useEffect, useState } from 'react';
import { openf1 } from './lib/openf1';

export const FIRST_YEAR = 2023; // OpenF1 coverage starts in 2023

/** Finished sessions for a year, newest first, labelled with the Grand Prix name. */
export function finishedSessions(meetings, sessions, now = Date.now()) {
  const names = new Map(meetings.map((m) => [m.meeting_key, m.meeting_name]));
  return sessions
    .filter((s) => !s.is_cancelled && Date.parse(s.date_end) < now)
    .map((s) => ({
      key: s.session_key,
      name: s.session_name,
      meeting: names.get(s.meeting_key) || s.location,
      date: s.date_start,
      label: `${names.get(s.meeting_key) || s.location} · ${s.session_name}`,
    }))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** The newest qualifying session, else the newest session of any kind. */
export function defaultSession(list) {
  return list.find((s) => s.name === 'Qualifying') || list[0] || null;
}

export function useSessions(year) {
  const [state, setState] = useState({ status: 'loading', sessions: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', sessions: [] });
    Promise.all([openf1.meetings(year), openf1.get('sessions', { year })])
      .then(([meetings, sessions]) => {
        if (!cancelled) setState({ status: 'ready', sessions: finishedSessions(meetings, sessions) });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', sessions: [], error: error.message });
      });
    return () => { cancelled = true; };
  }, [year]);

  return state;
}
