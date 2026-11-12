const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const testDirectory = join(process.cwd(), 'tests');
const files = readdirSync(testDirectory, { recursive: true })
  .filter((file) => file.endsWith('.test.cjs'))
  .sort()
  .map((file) => join(testDirectory, file));
const result = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
