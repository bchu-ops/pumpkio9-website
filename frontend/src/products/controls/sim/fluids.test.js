import { FLUIDS } from './fluids';
import { boilingPointC, vaporPressureBar } from './thermo';

test.each([['water', 100], ['ethanol', 78.35], ['glycol', 197.35]])('%s: Antoine gives ~1 atm at its normal boiling point', (id, tb) => {
  expect(vaporPressureBar(tb, FLUIDS[id])).toBeCloseTo(1.01325, 1);
  expect(boilingPointC(1.01325, FLUIDS[id])).toBeCloseTo(tb, 0);
});
