const { spawnSync } = require('node:child_process');

// Fingerprint embedding is optional development metadata. Avoid the Windows
// config-loader subprocess failure and its hashing cost on every native build.
// Set EXPO_SKIP_FINGERPRINT_EMBED=0 to explicitly enable it for diagnostics.
const env = { ...process.env };
if (process.platform === 'win32') {
  env.EXPO_SKIP_FINGERPRINT_EMBED ??= '1';
}
const result = spawnSync(
  process.execPath,
  [require.resolve('expo/bin/cli'), 'run:android', ...process.argv.slice(2)],
  { env, stdio: 'inherit' },
);
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
