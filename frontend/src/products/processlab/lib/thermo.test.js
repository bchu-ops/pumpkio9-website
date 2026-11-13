import { WATER, boilingPointC, pKw, vaporPressureBar } from './thermo';

test('water properties at 25 C match NIST', () => {
  expect(WATER.rho).toBe(997.05);
  expect(WATER.cp).toBe(4181.3);
});

test('Antoine: water vapor pressure at 100 C is about 1 atm', () => {
  expect(vaporPressureBar(100)).toBeCloseTo(1.01325, 1);
});

test('boiling point at 1 atm is about 100 C, and inverts vapor pressure', () => {
  expect(boilingPointC(1.01325)).toBeCloseTo(100, 0);
  expect(vaporPressureBar(boilingPointC(0.5))).toBeCloseTo(0.5, 6);
});

test('pKw interpolates the table', () => {
  expect(pKw(25)).toBeCloseTo(13.99, 6);
  expect(pKw(37.5)).toBeCloseTo((13.99 + 13.26) / 2, 6);
});
