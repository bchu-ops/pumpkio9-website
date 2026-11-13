import { createDataSource, decodeTelemetry } from './snapshot';

const json = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const missing = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });

const encoded = {
  t0: '2025-12-06T14:00:00.000Z',
  car: { ms: [0, 250], speed: [200, 210], throttle: [100, 100], brake: [0, 0], gear: [7, 7], rpm: [11000, 11100], drs: [0, 0] },
  loc: { ms: [0, 300], x: [10, 20], y: [5, 6] },
};

describe('decodeTelemetry', () => {
  it('rebuilds OpenF1-shaped rows', () => {
    const { car, location } = decodeTelemetry(encoded);
    expect(car[1]).toEqual({ date: '2025-12-06T14:00:00.250Z', speed: 210, throttle: 100, brake: 0, n_gear: 7, rpm: 11100, drs: 0 });
    expect(location[1]).toEqual({ date: '2025-12-06T14:00:00.300Z', x: 20, y: 6 });
  });
});

describe('createDataSource', () => {
  // CRA resets jest.fn implementations between tests, so build fresh fakes per test.
  const makeApi = () => ({
    meetings: jest.fn(() => Promise.resolve([{ meeting_key: 1, meeting_name: 'Live GP' }])),
    get: jest.fn((path) => Promise.resolve(path === 'sessions' ? [{ session_key: 9 }] : [{ from: 'api', path }])),
    drivers: jest.fn(() => Promise.resolve([{ driver_number: 1 }])),
    lapTelemetry: jest.fn(() => Promise.resolve({ car: ['api'], location: [] })),
  });

  it('uses the snapshot when it has the data', async () => {
    const api = makeApi();
    const files = {
      '/f1/index.json': { years: { 2025: { meetings: [{ meeting_key: 2 }], sessions: [{ session_key: 7 }] } } },
      '/f1/s/7.json': { drivers: [{ driver_number: 4 }], laps: [], stints: [], pits: [] },
      '/f1/s/7/4-12.json': encoded,
    };
    const fetchFn = jest.fn((url) => (files[url] ? json(files[url]) : missing()));
    const data = createDataSource({ base: '/f1', fetchFn, api });

    expect((await data.yearSessions(2025)).sessions).toEqual([{ session_key: 7 }]);
    expect((await data.sessionMeta(7)).drivers).toEqual([{ driver_number: 4 }]);
    const tel = await data.lapTelemetry(7, 4, { lap_number: 12 });
    expect(tel.car).toHaveLength(2);
    expect(api.drivers).not.toHaveBeenCalled();
    expect(api.lapTelemetry).not.toHaveBeenCalled();
  });

  it('falls back to the live API when files are missing', async () => {
    const api = makeApi();
    const data = createDataSource({ base: '/f1', fetchFn: missing, api });
    expect((await data.yearSessions(2024)).meetings[0].meeting_name).toBe('Live GP');
    const meta = await data.sessionMeta(5);
    expect(meta.drivers).toEqual([{ driver_number: 1 }]);
    expect(meta.laps[0].path).toBe('laps');
    expect((await data.lapTelemetry(5, 1, { lap_number: 3 })).car).toEqual(['api']);
  });

  it('treats tyre and pit data as optional', async () => {
    const flaky = { ...makeApi(), get: jest.fn((path) => (path === 'stints' || path === 'pit' ? Promise.reject(new Error('x')) : Promise.resolve([]))) };
    const data = createDataSource({ base: '/f1', fetchFn: missing, api: flaky });
    const meta = await data.sessionMeta(5);
    expect(meta.stints).toEqual([]);
    expect(meta.pits).toEqual([]);
  });

  it('survives a network error on the snapshot', async () => {
    const api = makeApi();
    const data = createDataSource({ base: '/f1', fetchFn: () => Promise.reject(new Error('offline')), api });
    expect((await data.sessionMeta(5)).drivers).toEqual([{ driver_number: 1 }]);
  });
});
