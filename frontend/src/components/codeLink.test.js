import { codeLink } from './codeLink';

test('GitHub links pass through, the site itself maps to its repo, others are dropped', () => {
  expect(codeLink({ link: 'https://github.com/bchu-ops/QCSD-iQuHACK-2022' })).toBe('https://github.com/bchu-ops/QCSD-iQuHACK-2022');
  expect(codeLink({ link: 'https://bchu-ops.github.io/pumpkio9-website/' })).toBe('https://github.com/bchu-ops/pumpkio9-website');
  expect(codeLink({ link: 'https://example.com/x' })).toBeNull();
  expect(codeLink({ link: '' })).toBeNull();
  expect(codeLink({})).toBeNull();
});
