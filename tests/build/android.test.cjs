const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

async function run(platform, env = {}, args = [], results = [{ status: 0 }]) {
  const spawned = [];
  const output = [];
  const warnings = [];
  const errors = [];
  const script = path.join(process.cwd(), 'scripts/android.cjs');
  let finish;
  const completed = new Promise((resolve) => {
    finish = resolve;
  });
  const fakeRequire = (id) =>
    id === 'node:child_process'
      ? {
          spawn: (...values) => {
            const result = results[spawned.length];
            assert.ok(result, 'unexpected extra Expo invocation');
            spawned.push(values);
            const child = new EventEmitter();
            child.stderr = new EventEmitter();
            queueMicrotask(() => {
              for (const chunk of result.stderr ?? [])
                child.stderr.emit('data', Buffer.from(chunk));
              if (result.error) child.emit('error', result.error);
              child.emit('close', result.status ?? null, result.signal ?? null);
            });
            return child;
          },
        }
      : require(id);
  fakeRequire.resolve = () => 'expo-cli';
  runInNewContext(readFileSync(script, 'utf8'), {
    require: fakeRequire,
    console: { warn: (value) => warnings.push(value), error: (value) => errors.push(value) },
    process: {
      platform,
      env,
      execPath: 'node',
      argv: ['node', script, ...args],
      stderr: { write: (chunk) => output.push(chunk.toString()) },
      exit: finish,
    },
  });
  const status = await completed;
  return { spawned, status, output, warnings, errors };
}

const replaced =
  'CommandError: Device emulator-5554 was replaced after discovery (transport 9 became 10)\n';

test('Windows Android build skips optional fingerprints and preserves interactive stdout and arguments', async () => {
  const { spawned, status } = await run(
    'win32',
    { PATH: 'unchanged' },
    ['--variant', 'release'],
    [{ status: 7 }],
  );
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0][0], 'node');
  assert.deepEqual(Array.from(spawned[0][1]), ['expo-cli', 'run:android', '--variant', 'release']);
  assert.equal(spawned[0][2].env.EXPO_SKIP_FINGERPRINT_EMBED, '1');
  assert.equal(spawned[0][2].env.PATH, 'unchanged');
  assert.deepEqual(Array.from(spawned[0][2].stdio), ['inherit', 'inherit', 'pipe']);
  assert.equal(status, 7);
});

test('explicit fingerprint opt-in is retained and other platforms keep their default', async () => {
  assert.equal(
    (await run('win32', { EXPO_SKIP_FINGERPRINT_EMBED: '0' })).spawned[0][2].env
      .EXPO_SKIP_FINGERPRINT_EMBED,
    '0',
  );
  assert.equal((await run('darwin')).spawned[0][2].env.EXPO_SKIP_FINGERPRINT_EMBED, undefined);
  assert.equal((await run('linux')).spawned[0][2].env.EXPO_SKIP_FINGERPRINT_EMBED, undefined);
});

test('a changed emulator transport triggers one rediscovery using the same serial and streams the original error', async () => {
  const { spawned, status, output, warnings } = await run(
    'win32',
    {},
    [],
    [{ status: 1, stderr: [replaced.slice(0, 40), replaced.slice(40)] }, { status: 0 }],
  );
  assert.equal(spawned.length, 2);
  assert.deepEqual(Array.from(spawned[1][1]), [
    'expo-cli',
    'run:android',
    '--device',
    'emulator-5554',
  ]);
  assert.equal(status, 0);
  assert.equal(output.join(''), replaced);
  assert.equal(warnings.length, 1);
});

test('retry preserves an explicitly selected AVD, build options and custom binary', async () => {
  const args = ['--device', 'Small_Phone', '--variant', 'release', '--binary', 'custom.apk'];
  const { spawned } = await run('win32', {}, args, [
    { status: 1, stderr: [replaced] },
    { status: 0 },
  ]);
  assert.deepEqual(Array.from(spawned[1][1]), ['expo-cli', 'run:android', ...args]);
});

test('a second transport failure exits without an unbounded retry loop', async () => {
  const { spawned, status } = await run(
    'win32',
    {},
    [],
    [
      { status: 1, stderr: [replaced] },
      { status: 1, stderr: [replaced] },
    ],
  );
  assert.equal(spawned.length, 2);
  assert.equal(status, 1);
});

test('build failures, uncertain installs, physical device replacement and interruption are not retried', async () => {
  for (const result of [
    { status: 1, stderr: ['FAILURE: Build failed with an exception.'] },
    { status: 1, stderr: ['INSTALL_FAILED_INSUFFICIENT_STORAGE'] },
    {
      status: 1,
      stderr: [
        'CommandError: Device physical-device was replaced after discovery (transport 9 became 10)',
      ],
    },
    { status: null, signal: 'SIGINT', stderr: [replaced] },
    { status: null, error: new Error('spawn failed') },
  ]) {
    const { spawned, status } = await run('win32', {}, [], [result]);
    assert.equal(spawned.length, 1);
    assert.equal(status, 1);
  }
});
