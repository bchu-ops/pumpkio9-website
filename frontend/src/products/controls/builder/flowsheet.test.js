import { simulateFlowsheet } from './flowsheet';
import { G, PIPE_CELLS, pipeUA, tankUA } from './units';
import { pipeCellsOutlet } from '../sim/heat';
import { WATER } from '../sim/fluids';

const last = (a) => a[a.length - 1];
const env = { Tamb: 20 };

test('open tank fills to the Torricelli steady level', () => {
  const units = [
    { id: 's', type: 'source', params: { flowLps: 2, T: 20 } },
    { id: 't', type: 'tank', params: { area: 1, outletCm2: 10, hMax: 10, h0: 0.1, T0: 20 } },
    { id: 'k', type: 'sink', params: {} },
  ];
  const run = simulateFlowsheet({ units, loops: [], env, dt: 0.5, tEnd: 3000 });
  expect(last(run.series['t.level'])).toBeCloseTo((0.002 / (0.65e-3)) ** 2 / (2 * G), 2);
});

test('pipe at steady state matches the N-cell heat-loss formula', () => {
  const pipe = { length: 50, diamMm: 50, wall: 'carbonSteel', wallMm: 3, ins: 'none', insMm: 0 };
  const units = [
    { id: 's', type: 'source', params: { flowLps: 0.5, T: 80 } },
    { id: 'p', type: 'pipe', params: pipe },
    { id: 'k', type: 'sink', params: {} },
  ];
  const run = simulateFlowsheet({ units, loops: [], env, dt: 0.5, tEnd: 2000 });
  const mcp = 0.5e-3 * WATER.rho * WATER.cp;
  const expected = pipeCellsOutlet({ Tin: 80, Tamb: 20, UA: pipeUA(pipe), mcp, cells: PIPE_CELLS });
  expect(last(run.series['p.T'])).toBeCloseTo(expected, 3);
});

test('insulation cuts pipe heat loss', () => {
  const base = { length: 50, diamMm: 50, wall: 'carbonSteel', wallMm: 3 };
  expect(pipeUA({ ...base, ins: 'mineralWool', insMm: 50 })).toBeLessThan(pipeUA({ ...base, ins: 'none', insMm: 0 }) / 10);
});

test('closed tank with no flow cools as T_amb + ΔT·exp(−t·UA/(M·cp))', () => {
  const tank = { area: 1, outletCm2: 1, hMax: 2, h0: 1, T0: 80, wall: 'stainless', wallMm: 3, ins: 'none', insMm: 0 };
  const units = [
    { id: 's', type: 'source', params: { flowLps: 0.1, T: 20 } },
    { id: 'v', type: 'valve', params: { opening: 0 } },
    { id: 't', type: 'tank', params: tank },
    { id: 'v2', type: 'valve', params: { opening: 0 } },
    { id: 'k', type: 'sink', params: {} },
  ];
  const tEnd = 3600;
  const run = simulateFlowsheet({ units, loops: [], env, dt: 1, tEnd });
  const M = WATER.rho * 1 * 1;
  expect(last(run.series['t.T'])).toBeCloseTo(20 + 60 * Math.exp(-(tEnd * tankUA(tank, 1)) / (M * WATER.cp)), 1);
});

test('energy balance closes at steady state (in + heat added = out + losses + vented)', () => {
  const units = [
    { id: 's', type: 'source', params: { flowLps: 0.2, T: 15 } },
    { id: 'h', type: 'heater', params: { powerKw: 40, maxKw: 100 } },
    { id: 'p', type: 'pipe', params: { length: 30, diamMm: 40, wall: 'copper', wallMm: 2, ins: 'none', insMm: 0 } },
    { id: 'k', type: 'sink', params: {} },
  ];
  const run = simulateFlowsheet({ units, loops: [], env, dt: 0.5, tEnd: 2000 });
  const b = run.balance;
  expect(Math.abs(b.in + b.added - b.out - b.losses - b.vented)).toBeLessThan(1e-3 * b.added);
});

test('two PID loops: level by inlet valve and temperature by heater', () => {
  const units = [
    { id: 's', type: 'source', params: { flowLps: 8, T: 15 } },
    { id: 'v', type: 'valve', params: { opening: 50 } },
    { id: 'h', type: 'heater', params: { powerKw: 0, maxKw: 1000 } },
    { id: 't', type: 'tank', params: { area: 0.5, outletCm2: 10, hMax: 4, h0: 1, T0: 30 } },
    { id: 'k', type: 'sink', params: {} },
  ];
  const loops = [
    { enabled: true, pv: 't.level', mv: 'v', sp: 2, Kc: 1, tauI: 120, reverse: false },
    { enabled: true, pv: 't.T', mv: 'h', sp: 50, Kc: 0.05, tauI: 120, reverse: false },
  ];
  const run = simulateFlowsheet({ units, loops, env, dt: 0.5, tEnd: 2400 });
  expect(last(run.series['t.level'])).toBeCloseTo(2, 1);
  expect(last(run.series['t.T'])).toBeCloseTo(50, 0);
});
