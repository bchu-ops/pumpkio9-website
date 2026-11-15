import { chokedDp, ffFactor, inherent, installed, kvFor, KV_PER_CV, sizeLiquidValve } from './valves';

test('Fisher Catalog 12 check case: 300 m³/h, ΔP 2 bar, Gf 0.908 → Cv 233.7', () => {
  const Kv = kvFor({ q: 300, dP: 2, Gf: 0.908 });
  expect(Kv / KV_PER_CV).toBeCloseTo(233.7, 1);
});

test('worked example: water 50 m³/h, 6 → 4 bar(a), FL 0.9', () => {
  const r = sizeLiquidValve({ q: 50, P1: 6, P2: 4, Pv: 0.0317, Gf: 1, FL: 0.9, Pc: 220.64 });
  expect(r.Kv).toBeCloseTo(35.355, 3);
  expect(r.Cv).toBeCloseTo(40.873, 3);
  expect(ffFactor(0.0317, 220.64)).toBeCloseTo(0.95664, 5);
  expect(r.dPch).toBeCloseTo(4.8354, 4);
  expect(r.choked).toBe(false);
  expect(r.sigma).toBeCloseTo(2.9842, 4);
  expect(r.status).toBe('ok');
});

test('choked variant sizes with ΔPmax and reports cavitation, not flashing', () => {
  const r = sizeLiquidValve({ q: 50, P1: 6, P2: 1, Pv: 0.0317, Gf: 1, FL: 0.9, Pc: 220.64 });
  expect(r.choked).toBe(true);
  expect(r.dPsizing).toBeCloseTo(4.8354, 4);
  expect(r.Kv).toBeCloseTo(22.738, 3);
  expect(r.sigma).toBeCloseTo(1.1937, 4);
  expect(r.sigma).toBeLessThan(r.sigmaChoked);
  expect(r.status).toBe('choked');
});

test('outlet below vapor pressure flashes; invalid ΔP is rejected', () => {
  expect(sizeLiquidValve({ q: 10, P1: 2, P2: 0.02, Pv: 0.0317, FL: 0.9 }).status).toBe('flashing');
  expect(sizeLiquidValve({ q: 10, P1: 2, P2: 3, Pv: 0.0317, FL: 0.9 }).error).toBeTruthy();
  expect(chokedDp({ FL: 1, P1: 5, Pv: 0 })).toBeCloseTo(5, 12);
});

test('inherent characteristics (R = 50)', () => {
  expect(inherent('linear', 0.5)).toBe(0.5);
  expect(inherent('equal', 0.5)).toBeCloseTo(0.14142, 5);
  expect(inherent('equal', 0.75)).toBeCloseTo(0.37606, 5);
  expect(inherent('quick', 0.75)).toBeCloseTo(0.86603, 5);
  expect(inherent('equal', 1)).toBe(1);
});

test('installed characteristic: N = 1 is inherent, low authority pushes flow up', () => {
  expect(installed(0.3, 1)).toBeCloseTo(0.3, 12);
  expect(installed(inherent('linear', 0.5), 0.5)).toBeCloseTo(0.63246, 5);
  expect(installed(inherent('equal', 0.5), 0.5)).toBeCloseTo(0.19803, 5);
  expect(installed(inherent('quick', 0.5), 0.2)).toBeCloseTo(0.91287, 5);
  expect(installed(inherent('equal', 0.75), 0.2)).toBeCloseTo(0.67203, 5); // 0.37606 / √(0.2 + 0.8·0.37606²)
  expect(installed(0, 0.3)).toBe(0);
});
