import { REACTOR_PRESETS } from './reactorPresets';
import { createPid } from './pid';
import { exothermicCstr, phCstr } from './reactors';
import { simulateLoop, simulateOpenLoop } from './simulate';

// Mirrors the per-reactor settings in Reactors.jsx (the consumer): slider ranges, time steps, models.
const DT = { ph: 0.01, cstr: 0.005 };
const CFG = {
  ph: {
    mvMin: 0, mvMax: 3, u0: 1, sp: [4, 10], manual: [0, 3], kc: [0.005, 2], ti: [0.5, 50],
    make: (p) => phCstr({ V: 20, Fa: 1, Ca: 0.01, Cb: 0.01, x0: 0, disturbAt: p.disturb ? 10 : undefined, CaAfter: 0.012 }),
  },
  cstr: {
    mvMin: 250, mvMax: 350, u0: 300, sp: [320, 380], manual: [280, 320], kc: [0.5, 50], ti: [0.1, 20],
    make: (p) => exothermicCstr({ CA0: p.CA0 ?? 0.5, T0: p.T0 ?? 350, disturbAt: p.disturb ? 5 : undefined, TiAfter: 355 }),
  },
};

const get = (id) => REACTOR_PRESETS.find((x) => x.id === id).p;
const run = (p) => {
  const R = CFG[p.reactor];
  const process = R.make(p);
  const dt = DT[p.reactor];
  return p.loop
    ? simulateLoop({ process, dt, tEnd: p.tEnd, sp: p.sp, deadTime: p.dead, u0: R.u0,
      pid: createPid({ Kc: p.Kc, tauI: p.tauI, uMin: R.mvMin, uMax: R.mvMax, bias: R.u0 }) })
    : simulateOpenLoop({ process, dt, tEnd: p.tEnd, u: p.manual, deadTime: p.dead, u0: R.u0 });
};

test('preset ids are unique and each has a label and a note', () => {
  const ids = REACTOR_PRESETS.map((x) => x.id);
  expect(new Set(ids).size).toBe(ids.length);
  REACTOR_PRESETS.forEach((x) => {
    expect(x.label.length).toBeGreaterThan(0);
    expect(x.note.length).toBeGreaterThan(0);
  });
});

test('both reactors are covered, because the tab switches reactor by finding the first preset for it', () => {
  expect(new Set(REACTOR_PRESETS.map((x) => x.p.reactor))).toEqual(new Set(['ph', 'cstr']));
  expect(REACTOR_PRESETS[0].p.reactor).toBe('ph');
});

test('every preset is valid for its reactor: numbers inside the slider ranges', () => {
  REACTOR_PRESETS.forEach(({ id, p }) => {
    const R = CFG[p.reactor];
    expect(R, id).toBeDefined();
    expect(typeof p.loop, id).toBe('boolean');
    expect(typeof p.disturb, id).toBe('boolean');
    expect(p.sp, id).toBeGreaterThanOrEqual(R.sp[0]);
    expect(p.sp, id).toBeLessThanOrEqual(R.sp[1]);
    expect(p.manual, id).toBeGreaterThanOrEqual(R.manual[0]);
    expect(p.manual, id).toBeLessThanOrEqual(R.manual[1]);
    expect(p.Kc, id).toBeGreaterThanOrEqual(R.kc[0]);
    expect(p.Kc, id).toBeLessThanOrEqual(R.kc[1]);
    expect(p.tauI, id).toBeGreaterThanOrEqual(R.ti[0]);
    expect(p.tauI, id).toBeLessThanOrEqual(R.ti[1]);
    expect(p.dead, id).toBeGreaterThanOrEqual(0);
    expect(p.tEnd, id).toBeGreaterThan(0);
  });
});

test('every preset simulates to finite output (runaway aside) with the expected sample count', () => {
  REACTOR_PRESETS.forEach(({ id, p }) => {
    const r = run(p);
    expect(r.t, id).toHaveLength(Math.round(p.tEnd / DT[p.reactor]) + 1);
    // pH never blows up; the reactor may run away, but only past a finite, plotted range.
    if (p.reactor === 'ph') r.pv.forEach((v) => expect(Number.isFinite(v), id).toBe(true));
  });
});

test('ph-hold: the PI loop holds pH 7 despite the acid-feed disturbance', () => {
  const r = run(get('ph-hold'));
  expect(r.pv.at(-1)).toBeGreaterThan(6.9);
  expect(r.pv.at(-1)).toBeLessThan(7.1);
});

test('ph-open: 1% extra base drives pH from 7 to about 9.7, as the note says', () => {
  const r = run(get('ph-open'));
  expect(r.pv[0]).toBeCloseTo(7, 3);
  expect(r.pv.at(-1)).toBeGreaterThan(9.6);
  expect(r.pv.at(-1)).toBeLessThan(9.8);
});

test('ph-lag: the sensor delay makes the same tuning swing more than ph-hold', () => {
  const swing = (r) => {
    const tail = r.pv.slice(Math.floor(r.pv.length / 2));
    return Math.max(...tail) - Math.min(...tail);
  };
  expect(swing(run(get('ph-lag')))).toBeGreaterThan(swing(run(get('ph-hold'))));
});

test('cstr-hold: the loop holds the unstable 350 K point', () => {
  const r = run(get('cstr-hold'));
  expect(Math.abs(r.pv.at(-1) - 350)).toBeLessThan(1);
});

test('cstr-drift: with the loop off, 0.5 K off the unstable point ignites then falls to the cold state', () => {
  const r = run(get('cstr-drift'));
  expect(Math.max(...r.pv)).toBeGreaterThan(430);
  expect(r.pv.at(-1)).toBeLessThan(350);
});

test('cstr-runaway: starts cold, then leaves the cold state when the coolant is 305 K', () => {
  const r = run(get('cstr-runaway'));
  expect(r.pv[0]).toBeCloseTo(324.48, 2);
  expect(Math.max(...r.pv)).toBeGreaterThan(350);
});