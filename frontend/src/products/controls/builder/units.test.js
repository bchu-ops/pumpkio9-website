import { FLUIDS, WATER } from '../sim/fluids';
import { G, enthalpy, fromEnthalpy, heaterOut, hxEffectivenessCounterflow, tankOutflow } from './units';
import { boilingPointC } from '../sim/thermo';

const stream = (T, fluid = WATER, m = 0.1, x = 0) => ({ m, T, x, fluid });

test('sensible heating: ΔT = Q/(m·cp)', () => {
  const out = heaterOut(stream(20), 5000);
  expect(out.T - 20).toBeCloseTo(5000 / (0.1 * WATER.cp), 9);
  expect(out.x).toBe(0);
});

test('heating past the boiling point vaporizes a fraction x = excess enthalpy / hvap', () => {
  const tb = boilingPointC(1.01325, WATER);
  const Q = 0.1 * WATER.cp * (tb - 20) + 0.1 * 0.25 * WATER.hvap;
  const out = heaterOut(stream(20), Q);
  expect(out.T).toBeCloseTo(tb, 9);
  expect(out.x).toBeCloseTo(0.25, 9);
});

test('ethanol boils earlier than water for the same duty', () => {
  const Q = 0.1 * 4000 * 70;
  expect(heaterOut(stream(20, FLUIDS.ethanol), Q).x).toBeGreaterThan(0);
  expect(heaterOut(stream(20, WATER), Q).x).toBe(0);
});

test('enthalpy round-trips through fromEnthalpy', () => {
  const st = fromEnthalpy(WATER, enthalpy(WATER, 55, 0));
  expect(st.T).toBeCloseTo(55, 9);
});

test('Torricelli outflow q = Cd·a·√(2gh)', () => {
  expect(tankOutflow({ h: 2, a: 1e-3, opening: 1 })).toBeCloseTo(0.65 * 1e-3 * Math.sqrt(2 * G * 2), 12);
});

test('counterflow effectiveness with Cr = 1 is NTU/(1+NTU)', () => {
  expect(hxEffectivenessCounterflow(2, 1)).toBeCloseTo(2 / 3, 12);
});
