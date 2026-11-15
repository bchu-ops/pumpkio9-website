import { cohenCoon, simcPI, zieglerNicholsUltimate } from './tuning';

test('Ziegler-Nichols ultimate-gain table (classic)', () => {
  expect(zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'P' })).toEqual({ Kc: 5 });
  const pi = zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'PI' });
  expect(pi.Kc).toBeCloseTo(4.5); expect(pi.tauI).toBeCloseTo(4 / 1.2);
  expect(zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'PID' })).toEqual({ Kc: 6, tauI: 2, tauD: 0.5 });
});

test('Cohen–Coon PI and PID for K = 1, τ = 5, θ = 1', () => {
  const pi = cohenCoon({ K: 1, tau: 5, theta: 1, type: 'PI' });
  expect(pi.Kc).toBeCloseTo(4.58333, 5);
  expect(pi.tauI).toBeCloseTo(30.6 / 13, 5);
  const pid = cohenCoon({ K: 1, tau: 5, theta: 1, type: 'PID' });
  expect(pid.Kc).toBeCloseTo(6.91667, 5);
  expect(pid.tauI).toBeCloseTo(33.2 / 14.6, 5);
  expect(pid.tauD).toBeCloseTo(4 / 11.4, 5);
  expect(cohenCoon({ K: 1, tau: 5, theta: 0, type: 'PI' })).toBeNull();
});

test('SIMC PI (Skogestad 2003): τc = θ gives Kc = 0.5τ/(Kθ), τI = min(τ, 8θ)', () => {
  expect(simcPI({ K: 1, tau: 5, theta: 1 })).toEqual({ Kc: 2.5, tauI: 5 });
  expect(simcPI({ K: 2, tau: 20, theta: 1, tauC: 1 })).toEqual({ Kc: 5, tauI: 8 });
});
