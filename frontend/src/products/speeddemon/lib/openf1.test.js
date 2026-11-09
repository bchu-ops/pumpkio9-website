import { buildUrl, createClient } from './openf1';

const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const status = (code) => Promise.resolve({ ok: false, status: code, json: () => Promise.resolve({}) });

describe('buildUrl', () => {
  it('keeps comparison operators in keys and encodes values', () => {
    const url = buildUrl('car_data', {
      session_key: 9839,
      'date>=': '2025-12-07T14:00:12.872+00:00',
      'date<=': '2025-12-07T14:01:40.000Z',
    });
    expect(url).toBe(
      'https://api.openf1.org/v1/car_data?session_key=9839'
      + '&date>=2025-12-07T14%3A00%3A12.872%2B00%3A00'
      + '&date<=2025-12-07T14%3A01%3A40.000Z'
    );
  });

  it('skips empty params', () => {
    expect(buildUrl('drivers', { session_key: 1, driver_number: undefined })).toBe(
      'https://api.openf1.org/v1/drivers?session_key=1'
    );
  });
});

describe('createClient', () => {
  it('caches identical requests', async () => {
    const fetchFn = jest.fn(() => ok([{ a: 1 }]));
    const client = createClient({ fetchFn, storage: null });
    await client.get('drivers', { session_key: 1 });
    await client.get('drivers', { session_key: 1 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries once after a rate limit', async () => {
    const fetchFn = jest.fn()
      .mockImplementationOnce(() => status(429))
      .mockImplementationOnce(() => ok([1, 2]));
    const client = createClient({ fetchFn, storage: null, retryDelayMs: 1 });
    await expect(client.get('laps', { session_key: 1 })).resolves.toEqual([1, 2]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('rejects with a readable error on failure', async () => {
    const client = createClient({ fetchFn: () => status(500), storage: null, retryDelayMs: 1 });
    await expect(client.get('laps', { session_key: 1 })).rejects.toThrow(/OpenF1 request failed \(500\)/);
  });

  it('rejects responses that are not lists', async () => {
    const client = createClient({ fetchFn: () => ok({ detail: 'nope' }), storage: null });
    await expect(client.get('laps', { session_key: 1 })).rejects.toThrow(/unexpected response/i);
  });

  it('runs at most two requests at a time', async () => {
    let active = 0;
    let peak = 0;
    const fetchFn = jest.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return { ok: true, status: 200, json: async () => [] };
    });
    const client = createClient({ fetchFn, storage: null });
    await Promise.all([1, 2, 3, 4, 5].map((k) => client.get('drivers', { session_key: k })));
    expect(peak).toBeLessThanOrEqual(2);
    expect(fetchFn).toHaveBeenCalledTimes(5);
  });
});
