const { assert, beforeEach, test } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const hooks = createHookHarness();
const mock = createModuleMock(require);
let fontScale = 1;
mock('react', hooks.react);
mock('react-native', { useWindowDimensions: () => ({ fontScale }) });
const { useChipColumn } = require('../../src/features/planner/hooks/useChipColumn.ts');
const render = (key = 'notes') => {
  const value = hooks.render(() => useChipColumn(key));
  hooks.flushLayoutEffects();
  return value;
};
const box = (y, width = 300, height = 26) => ({
  nativeEvent: { layout: { y, width, height } },
});
beforeEach(() => {
  hooks.reset();
  fontScale = 1;
});

test('multiple single-line chips stay horizontal and overflow wraps naturally', () => {
  const layout = render();
  layout.measureContainer(box(0));
  layout.measureChip(0, box(4));
  layout.measureChip(1, box(4));
  assert.equal(render().column, false);
  layout.measureChip(2, box(36));
  assert.equal(render().column, false);
});

test('one multiline chip switches to a stable single column', () => {
  let layout = render();
  layout.measureContainer(box(0));
  layout.measureChip(0, box(4, 300, 48));
  layout = render();
  assert.equal(layout.column, true);
  layout.measureChip(0, box(4));
  layout.measureChip(1, box(36));
  assert.equal(render().column, true);
});

test('resizing, changing content and font size remeasure chip height', () => {
  let layout = render();
  layout.measureContainer(box(0));
  const wrap = () => {
    layout.measureChip(0, box(4));
    layout.measureChip(1, box(36, 300, 48));
    layout = render();
    assert.equal(layout.column, true);
  };
  wrap();
  layout.measureContainer(box(0, 600));
  layout = render();
  assert.equal(layout.column, false);
  wrap();
  assert.equal(render('shorter notes').column, false);
  layout = render();
  wrap();
  fontScale = 1.5;
  assert.equal(render().column, false);
});

test('larger single-line text does not trigger a column', () => {
  fontScale = 1.5;
  const layout = render();
  layout.measureContainer(box(0));
  layout.measureChip(0, box(4, 300, 37));
  layout.measureChip(1, box(47, 300, 37));
  assert.equal(render().column, false);
  layout.measureChip(2, box(90, 300, 70));
  assert.equal(render().column, true);
});
