const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

function run(platform, env = {}, args = [], result = { status: 0 }) {
  let spawned;
  let status;
  const script = path.join(process.cwd(), 'scripts/android.cjs');
  const fakeRequire = () => ({
    spawnSync: (...values) => {
      spawned = values;
      return result;
    },
  });
  fakeRequire.resolve = () => 'expo-cli';
  runInNewContext(readFileSync(script, 'utf8'), {
    require: fakeRequire,
    console,
    process: {
      platform,
      env,
      execPath: 'node',
      argv: ['node', script, ...args],
      exit: (value) => {
        status = value;
      },
    },
  });
  return { spawned, status };
}

test('Windows Android build skips optional fingerprints and forwards Expo arguments and exit status', () => {
  const { spawned, status } = run('win32', { PATH: 'unchanged' }, ['--variant', 'release'], {
    status: 7,
  });
  assert.equal(spawned[0], 'node');
  assert.deepEqual(Array.from(spawned[1]), ['expo-cli', 'run:android', '--variant', 'release']);
  assert.equal(spawned[2].env.EXPO_SKIP_FINGERPRINT_EMBED, '1');
  assert.equal(spawned[2].env.PATH, 'unchanged');
  assert.equal(spawned[2].stdio, 'inherit');
  assert.equal(status, 7);
});

test('explicit fingerprint opt-in is retained and other platforms keep their default', () => {
  assert.equal(
    run('win32', { EXPO_SKIP_FINGERPRINT_EMBED: '0' }).spawned[2].env.EXPO_SKIP_FINGERPRINT_EMBED,
    '0',
  );
  assert.equal(run('darwin').spawned[2].env.EXPO_SKIP_FINGERPRINT_EMBED, undefined);
  assert.equal(run('linux').spawned[2].env.EXPO_SKIP_FINGERPRINT_EMBED, undefined);
});
