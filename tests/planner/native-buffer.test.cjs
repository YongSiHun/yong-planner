const { assert, beforeEach, test } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const { createAnimationFrames } = require('../support/frames.cjs');
const frames = createAnimationFrames();
global.requestAnimationFrame = frames.request;
global.cancelAnimationFrame = frames.cancel;
const hooks = createHookHarness();
createModuleMock(require)('react', hooks.react);
const {
  useNativeInputBuffer,
} = require('../../src/features/planner/hooks/useNativeInputBuffer.ts');
const render = () => hooks.render(() => useNativeInputBuffer('회의'), { layout: false });
beforeEach(() => {
  hooks.reset();
  frames.reset();
});

test('a new native keystroke cancels a pending chip correction before it can overwrite composition', () => {
  let buffer = render();
  buffer.accept('회의,', '\u200B');
  buffer = render();
  assert.equal(buffer.value, '\u200B');
  buffer.accept('\u200Bㅎ', '\u200Bㅎ');
  hooks.flushLayoutEffects();
  buffer = render();
  assert.equal(buffer.value, undefined);
  assert.equal(buffer.defaultValue, '\u200Bㅎ');
});

test('an older layout release cannot discard a newer split or chip selection', () => {
  let buffer = render();
  buffer.replace('장보기');
  buffer = render();
  hooks.flushLayoutEffects();
  buffer.replace('운동');
  frames.flush();
  buffer = render();
  assert.equal(buffer.value, '운동');
  hooks.flushLayoutEffects();
  frames.flush();
  buffer = render();
  assert.equal(buffer.value, undefined);
  assert.equal(buffer.defaultValue, '운동');
});
