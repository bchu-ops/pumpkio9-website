import { cleanLaps, compoundColor, stintFor, paceSummary } from './race';

const laps = [
  { lap_number: 1, lap_duration: 94.4 },
  { lap_number: 2, lap_duration: 89.9 },
  { lap_number: 3, lap_duration: null },
  { lap_number: 4, lap_duration: 110.2 }, // pit in / safety car
  { lap_number: 5, lap_duration: 88.8, is_pit_out_lap: true },
  { lap_number: 6, lap_duration: 89.1 },
  { lap_number: 7, lap_duration: 88.9 },
];

describe('cleanLaps', () => {
  const clean = cleanLaps(laps);
  it('keeps timed laps in order', () => {
    expect(clean.map((l) => l.lap)).toEqual([1, 2, 4, 5, 6, 7]);
  });
  it('flags slow laps (over 107% of the median) and pit-out laps', () => {
    expect(clean.find((l) => l.lap === 4).slow).toBe(true);
    expect(clean.find((l) => l.lap === 5).pitOut).toBe(true);
    expect(clean.find((l) => l.lap === 6).slow).toBe(false);
  });
});

describe('paceSummary', () => {
  it('reports best lap and median of representative laps', () => {
    const p = paceSummary(cleanLaps(laps));
    expect(p.best.lap).toBe(7);
    expect(p.median).toBeCloseTo(89.1, 3);
    expect(p.count).toBe(3); // laps 2, 6, 7: no standing start, pit-out or slow laps
  });
  it('handles no laps', () => {
    expect(paceSummary([])).toEqual({ best: null, median: null, count: 0 });
  });
});

describe('stints', () => {
  const stints = [
    { lap_start: 1, lap_end: 23, compound: 'MEDIUM' },
    { lap_start: 24, lap_end: 58, compound: 'HARD' },
  ];
  it('finds the tyre for a lap', () => {
    expect(stintFor(stints, 10).compound).toBe('MEDIUM');
    expect(stintFor(stints, 24).compound).toBe('HARD');
    expect(stintFor(stints, 99)).toBeNull();
  });
  it('colours compounds like F1 graphics', () => {
    expect(compoundColor('SOFT')).toBe('#e8002d');
    expect(compoundColor('hard')).toBe('#ebebeb');
    expect(compoundColor('UNKNOWN')).toBe('#9b9b9b');
  });
});
