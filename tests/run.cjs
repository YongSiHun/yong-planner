const { readdirSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const testDirectory = dirname(require.resolve('./run.cjs'));
const args = process.argv.slice(2);
const suites = args
  .filter((arg) => arg.startsWith('--suite='))
  .map((arg) => arg.slice(8).replaceAll('\\', '/'));
const options = args.filter((arg) => !arg.startsWith('--suite='));
const files = readdirSync(testDirectory, { recursive: true })
  .map((file) => file.replaceAll('\\', '/'))
  .filter((file) => file.endsWith('.test.cjs'))
  .filter(
    (file) =>
      suites.length === 0 ||
      suites.some(
        (suite) => file === suite || file.startsWith(suite + '/') || file.startsWith(suite + '.'),
      ),
  )
  .sort()
  .map((file) => join(testDirectory, file));

if (files.length === 0) {
  console.error('No test files matched: ' + suites.join(', '));
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...options, ...files], {
  cwd: resolve(testDirectory, '..'),
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
