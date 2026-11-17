const { assert, beforeEach, test } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const hooks = createHookHarness();
const mock = createModuleMock(require);
const errors = [];
mock('react', hooks.react);
mock('../../src/components/ui/index.tsx', { report: (error) => errors.push(error) });
const { useAsyncOperation } = require('../../src/hooks/useAsyncOperation.ts');
const render = (unavailable = false) => hooks.render(() => useAsyncOperation(unavailable));
beforeEach(() => {
  hooks.reset();
  errors.length = 0;
});

test('rapid repeated calls share a synchronous lock and release it after completion', async () => {
  let finish,
    calls = 0;
  const action = () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const operation = render();
  const pending = operation.run(action);
  await operation.run(action);
  assert.equal(calls, 1);
  assert.equal(render().busy, true);
  finish();
  await pending;
  assert.equal(render().busy, false);
  assert.equal(render().isRunning(), false);
});

test('unavailable data blocks work; errors are reported and a later retry succeeds', async () => {
  let calls = 0;
  await render(true).run(async () => {
    calls++;
  });
  assert.equal(calls, 0);
  await render().run(async () => {
    throw Error('write failed');
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /write failed/);
  assert.equal(render().busy, false);
  await render().run(async () => {
    calls++;
  });
  assert.equal(calls, 1);
});
