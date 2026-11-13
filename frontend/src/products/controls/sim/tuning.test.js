import { zieglerNicholsUltimate } from './tuning';

test('Ziegler-Nichols ultimate-gain table (classic)', () => {
  expect(zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'P' })).toEqual({ Kc: 5 });
  const pi = zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'PI' });
  expect(pi.Kc).toBeCloseTo(4.5); expect(pi.tauI).toBeCloseTo(4 / 1.2);
  expect(zieglerNicholsUltimate({ Ku: 10, Pu: 4, type: 'PID' })).toEqual({ Kc: 6, tauI: 2, tauD: 0.5 });
});
