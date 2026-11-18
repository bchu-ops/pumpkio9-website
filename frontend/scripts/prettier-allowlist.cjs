// Runs Prettier on the files listed in .prettier-allowlist only.
// Usage: node scripts/prettier-allowlist.cjs --write | --check
const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mode = process.argv[2] === '--write' ? '--write' : '--check';
const files = readFileSync(path.join(root, '.prettier-allowlist'), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const bin = path.join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const result = spawnSync(process.execPath, [bin, mode, ...files], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
