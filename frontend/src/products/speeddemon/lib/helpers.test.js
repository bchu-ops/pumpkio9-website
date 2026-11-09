import { driverColors, lighten } from './colors';
import { finishedSessions, defaultSession } from '../useSessions';
import { rankDrivers } from '../useLapComparison';

describe('driverColors', () => {
  it('uses team colours', () => {
    expect(driverColors('4781D7', 'F47600')).toEqual({ a: '#4781d7', b: '#f47600' });
  });
  it('separates teammates', () => {
    const c = driverColors('4781D7', '4781D7');
    expect(c.a).toBe('#4781d7');
    expect(c.b).not.toBe(c.a);
  });
  it('falls back when a colour is missing', () => {
    expect(driverColors(null, undefined)).toEqual({ a: '#2383e2', b: '#e2554f' });
  });
  it('lightens toward white', () => {
    expect(lighten('#000000', 0.5)).toBe('#808080');
  });
});

describe('finishedSessions', () => {
  const meetings = [{ meeting_key: 1, meeting_name: 'Abu Dhabi Grand Prix' }];
  const sessions = [
    { session_key: 10, meeting_key: 1, session_name: 'Qualifying', date_start: '2025-12-06T14:00:00Z', date_end: '2025-12-06T15:00:00Z' },
    { session_key: 11, meeting_key: 1, session_name: 'Race', date_start: '2025-12-07T13:00:00Z', date_end: '2025-12-07T15:00:00Z' },
    { session_key: 12, meeting_key: 1, session_name: 'Race', date_start: '2099-01-01T13:00:00Z', date_end: '2099-01-01T15:00:00Z' },
    { session_key: 13, meeting_key: 1, session_name: 'Sprint', date_start: '2025-12-05T13:00:00Z', date_end: '2025-12-05T14:00:00Z', is_cancelled: true },
  ];
  const list = finishedSessions(meetings, sessions, Date.parse('2026-01-01'));

  it('keeps finished, non-cancelled sessions, newest first', () => {
    expect(list.map((s) => s.key)).toEqual([11, 10]);
    expect(list[0].label).toBe('Abu Dhabi Grand Prix · Race');
  });
  it('defaults to the newest qualifying', () => {
    expect(defaultSession(list).key).toBe(10);
    expect(defaultSession([])).toBeNull();
  });
});

describe('rankDrivers', () => {
  it('orders drivers by fastest lap and keeps drivers without a lap last', () => {
    const drivers = [{ driver_number: 1 }, { driver_number: 4 }, { driver_number: 16 }];
    const laps = [
      { driver_number: 1, lap_duration: 82.2 },
      { driver_number: 4, lap_duration: 82.1 },
      { driver_number: 4, lap_duration: 90 },
    ];
    const ranked = rankDrivers(drivers, laps);
    expect(ranked.map((d) => d.driver_number)).toEqual([4, 1, 16]);
    expect(ranked[0].best.lap_duration).toBe(82.1);
    expect(ranked[2].best).toBeNull();
  });
});
