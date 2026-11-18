import { H, INSULATION, WALLS } from './materials';

// Values are pinned to the sources cited in materials.js:
//  K1 https://en.wikipedia.org/wiki/List_of_thermal_conductivities
//  K2 https://www.engineeringtoolbox.com/thermal-conductivity-d_429.html
// h values: Incropera et al., Fundamentals of Heat and Mass Transfer, Table 1.1.

test('wall conductivities are pinned [W/(m.K)]', () => {
  expect(Object.fromEntries(Object.entries(WALLS).map(([k, v]) => [k, v.k]))).toEqual({
    stainless: 16, // K1 16.3 at 296 K; K2 17
    carbonSteel: 45, // K1 36-54
    copper: 400, // K1 401
    aluminium: 237, // K1 237
    glass: 1.1, // K1 Pyrex 7740: 1.11 at 300 K
    hdpe: 0.45, // K1 0.42-0.51
  });
});

test('insulation conductivities are pinned [W/(m.K)]', () => {
  expect(Object.fromEntries(Object.entries(INSULATION).map(([k, v]) => [k, v.k]))).toEqual({
    none: 1, // UNSOURCED placeholder: no cited source in materials.js (thickness is forced to 0 for "none")
    mineralWool: 0.04, // K1
    pu: 0.03, // K1
    fiberglass: 0.04, // K1 0.045
  });
});

test('convective coefficients are pinned [W/(m2.K)] and sit inside the cited Incropera ranges', () => {
  expect(H).toEqual({ airFree: 10, waterFree: 500, waterForced: 3000 });
  expect(H.airFree).toBeGreaterThanOrEqual(2); // free convection, gases: 2-25
  expect(H.airFree).toBeLessThanOrEqual(25);
  expect(H.waterFree).toBeGreaterThanOrEqual(50); // free convection, liquids: 50-1000
  expect(H.waterFree).toBeLessThanOrEqual(1000);
  expect(H.waterForced).toBeGreaterThanOrEqual(100); // forced convection, liquids: 100-20 000
  expect(H.waterForced).toBeLessThanOrEqual(20000);
});

test('every material has a name and a finite positive k', () => {
  [...Object.values(WALLS), ...Object.values(INSULATION)].forEach((m) => {
    expect(typeof m.name).toBe('string');
    expect(m.name.length).toBeGreaterThan(0);
    expect(Number.isFinite(m.k)).toBe(true);
    expect(m.k).toBeGreaterThan(0);
  });
  Object.values(H).forEach((h) => expect(h).toBeGreaterThan(0));
});

test('real insulation conducts far less than any wall; metals conduct more than plastics and glass', () => {
  const insulating = Object.entries(INSULATION).filter(([id]) => id !== 'none').map(([, m]) => m.k);
  const minWall = Math.min(...Object.values(WALLS).map((w) => w.k));
  insulating.forEach((k) => expect(k).toBeLessThan(minWall));
  expect(WALLS.copper.k).toBeGreaterThan(WALLS.aluminium.k);
  expect(WALLS.aluminium.k).toBeGreaterThan(WALLS.carbonSteel.k);
  expect(WALLS.carbonSteel.k).toBeGreaterThan(WALLS.stainless.k);
  expect(WALLS.stainless.k).toBeGreaterThan(WALLS.glass.k);
  expect(WALLS.glass.k).toBeGreaterThan(WALLS.hdpe.k);
});

test('convection ordering: free air < free water < forced water', () => {
  expect(H.airFree).toBeLessThan(H.waterFree);
  expect(H.waterFree).toBeLessThan(H.waterForced);
});

test('wall and insulation ids used as defaults by units.js exist', () => {
  expect(WALLS.stainless).toBeDefined();
  expect(INSULATION.none).toBeDefined();
});
