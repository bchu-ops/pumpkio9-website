import { applicableGains } from './TuningRules';

test('applied gains are limited to the slider ranges and flagged', () => {
  expect(applicableGains({ Kc: 1350, tauI: 0.33 })).toEqual({ Kc: 50, tauI: 0.5, tauD: 0, useI: true, limited: true });
  expect(applicableGains({ Kc: 2.5, tauI: 5 })).toEqual({ Kc: 2.5, tauI: 5, tauD: 0, useI: true, limited: false });
});
