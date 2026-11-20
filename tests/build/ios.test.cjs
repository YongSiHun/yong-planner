const { assert, test } = require('../support/test.cjs');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { runInNewContext } = require('node:vm');

async function run({ status = 0, error, preparationError } = {}) {
  const spawned = [];
  const order = [];
  const errors = [];
  let finish;
  const completed = new Promise((resolve) => {
    finish = resolve;
  });
  const fakeRequire = (id) => {
    if (id === './ios-device.cjs')
      return {
        prepareIosDevice: async (args) => {
          order.push('prepare');
          assert.deepEqual(Array.from(args), ['--configuration', 'Release']);
          if (preparationError) throw preparationError;
          return [...args, '--device', 'UDID'];
        },
      };
    if (id === 'node:child_process')
      return {
        spawn: (...args) => {
          order.push('expo');
          spawned.push(args);
          const child = new EventEmitter();
          queueMicrotask(() => {
            if (error) child.emit('error', error);
            child.emit('close', status);
          });
          return child;
        },
      };
    return require(id);
  };
  fakeRequire.resolve = () => 'expo-cli';
  const script = path.join(process.cwd(), 'scripts/ios.cjs');
  runInNewContext(readFileSync(script, 'utf8'), {
    require: fakeRequire,
    console: { error: (message) => errors.push(message) },
    process: {
      argv: ['node', script, '--configuration', 'Release'],
      execPath: 'node',
      env: { PATH: 'original' },
      exit: finish,
    },
  });
  return { status: await completed, spawned, order, errors };
}

test('iOS prepares the simulator before launching Expo and preserves terminal interaction', async () => {
  const result = await run();
  assert.deepEqual(result.order, ['prepare', 'expo']);
  assert.deepEqual(Array.from(result.spawned[0][1]), [
    'expo-cli',
    'run:ios',
    '--configuration',
    'Release',
    '--device',
    'UDID',
  ]);
  assert.equal(result.spawned[0][2].stdio, 'inherit');
  assert.equal(result.spawned[0][2].env.PATH, 'original');
  assert.equal(result.status, 0);
});

test('failed simulator preparation prevents the build from starting', async () => {
  const result = await run({ preparationError: new Error('Boot failed') });
  assert.equal(result.spawned.length, 0);
  assert.equal(result.status, 1);
  assert.deepEqual(result.errors, ['Boot failed']);
});

test('build failures, interruption and spawn errors exit without automatic rebuilds', async () => {
  for (const options of [{ status: 65 }, { status: null }, { error: new Error('spawn failed') }]) {
    const result = await run(options);
    assert.equal(result.spawned.length, 1);
    assert.equal(result.status, options.status === 65 ? 65 : 1);
  }
});
