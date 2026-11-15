import { cylinderUA, pipeCellsOutlet, wallU } from './heat';

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

test('cylindrical layers: 25 mm pipe, 3 mm steel, 50 mm mineral wool (Incropera eq. 3.33)', () => {
  // Hand calculation per metre: films 0.004244 + 0.24298, steel 0.000761, wool 5.7347 → 5.9827 K/W
  const UA = cylinderUA({ hIn: 3000, hOut: 10, rIn: 0.0125, length: 1, layers: [{ t: 0.003, k: 45 }, { t: 0.05, k: 0.04 }] });
  expect(1 / UA).toBeCloseTo(5.9827, 3);
});

test('cylindrical layers approach the plane wall when the wall is thin vs. the radius', () => {
  const layers = [{ t: 0.001, k: 16 }];
  const r = 10; // m: wall is 1e-4 of the radius
  const UA = cylinderUA({ hIn: 1000, hOut: 10, rIn: r, length: 1, layers });
  const planar = wallU({ hIn: 1000, hOut: 10, layers }) * 2 * Math.PI * r;
  expect(UA / planar).toBeCloseTo(1, 3);
});
