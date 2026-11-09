// Hits the real OpenF1 API. Run with: OPENF1_LIVE=1 CI=true npx react-scripts test src/products
import { createClient } from './openf1';
import { buildTrace, compareLaps, fastestLap, insights, lapTime, miniSectors } from './telemetry';

const live = process.env.OPENF1_LIVE === '1' ? describe : describe.skip;

live('OpenF1 live: 2025 Abu Dhabi qualifying, VER vs NOR', () => {
  jest.setTimeout(60000);
  const client = createClient({ fetchFn: (...a) => fetch(...a), storage: null });

  it('compares the two fastest laps end to end', async () => {
    const meetings = await client.meetings(2025);
    const abuDhabi = meetings.find((m) => /Abu Dhabi/.test(m.meeting_name));
    const sessions = await client.sessions(abuDhabi.meeting_key);
    const quali = sessions.find((s) => s.session_name === 'Qualifying');
    const drivers = await client.drivers(quali.session_key);
    expect(drivers.length).toBeGreaterThanOrEqual(20);

    const traces = {};
    const laps = {};
    for (const n of [1, 4]) {
      const lap = fastestLap(await client.laps(quali.session_key, n));
      const { car, location } = await client.lapTelemetry(quali.session_key, n, lap);
      laps[n] = lap;
      traces[n] = buildTrace(car, location, lap.date_start, lap.lap_duration);
      expect(traces[n].length).toBeGreaterThan(200);
    }

    const cmp = compareLaps(traces[1], traces[4], 600);
    const gap = laps[4].lap_duration - laps[1].lap_duration;
    // Lap is ~5.3 km at Yas Marina; integrated distance should be close.
    expect(cmp.length).toBeGreaterThan(5000);
    expect(cmp.length).toBeLessThan(5600);
    expect(cmp.delta[cmp.delta.length - 1]).toBeCloseTo(gap, 3);
    expect(cmp.a.every((p) => p.x !== null)).toBe(true);

    const sectors = miniSectors(cmp, 24);
    const notes = insights(cmp, { a: 'VER', b: 'NOR' });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      session: quali.session_key,
      VER: lapTime(laps[1].lap_duration),
      NOR: lapTime(laps[4].lap_duration),
      lengthM: Math.round(cmp.length),
      sectorsWonByVER: sectors.filter((s) => s.winner === 'a').length,
      notes,
    }, null, 1));
  });
});
