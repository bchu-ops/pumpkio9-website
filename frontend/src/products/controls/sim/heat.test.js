import { pipeCellsOutlet, wallU } from './heat';

test('series resistances: 1/U = 1/hIn + sum(t/k) + 1/hOut', () => {
  const U = wallU({ hIn: 1000, hOut: 10, layers: [{ t: 0.003, k: 16 }, { t: 0.05, k: 0.04 }] });
  expect(U).toBeCloseTo(1 / (1 / 1000 + 0.003 / 16 + 0.05 / 0.04 + 1 / 10), 12);
});

test('zero-thickness layers are ignored', () => {
  expect(wallU({ hIn: 100, hOut: 100, layers: [{ t: 0, k: 0.04 }] })).toBeCloseTo(50, 12);
});

test('N mixed cells in series at steady state: (T−Ta) shrinks by 1/(1+UA/(N·m·cp)) per cell', () => {
  const out = pipeCellsOutlet({ Tin: 80, Tamb: 20, UA: 500, mcp: 4000, cells: 10 });
  expect(out).toBeCloseTo(20 + 60 / (1 + 500 / 10 / 4000) ** 10, 10);
});
