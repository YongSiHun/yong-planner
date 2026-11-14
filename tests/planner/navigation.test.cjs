require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { centeredDateOffset } = require('../../src/features/planner/services/navigation.ts');
let slots = [];
let cursor = 0;
const reactPath = require.resolve('react');
require.cache[reactPath] = {
  id: reactPath,
  filename: reactPath,
  loaded: true,
  exports: {
    useCallback: (callback) => callback,
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
  },
};
const notices = [];
const uiPath = require.resolve('../../src/components/ui/index.tsx');
require.cache[uiPath] = {
  id: uiPath,
  filename: uiPath,
  loaded: true,
  exports: { showToast: (message) => notices.push(message) },
};
const { useMonthNavigation } = require('../../src/features/planner/hooks/useMonthNavigation.ts');
function render() {
  cursor = 0;
  // React 훅: 상태 유지 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMonthNavigation();
}
beforeEach(() => {
  slots = [];
  cursor = 0;
});

test('dates start at the upper 20 percent for different row and screen heights', () => {
  for (const viewport of [320, 600, 900]) {
    for (const height of [44, 88, 180]) {
      const y = 1000;
      const offset = centeredDateOffset(y, height, viewport, 3000);
      assert.equal(y - offset, viewport * 0.2);
    }
  }
});

test('month boundaries and short content never scroll past the content', () => {
  assert.equal(centeredDateOffset(0, 44, 600, 1400), 0);
  assert.equal(centeredDateOffset(1276, 44, 600, 1400), 800);
  assert.equal(centeredDateOffset(100, 44, 600, 300), 0);
  assert.equal(centeredDateOffset(0, 44, 600, 0), 0);
});

test('initial navigation waits for row, viewport and content measurements', () => {
  let controller = render();
  const calls = [];
  controller.scrollRef.current = { scrollTo: (options) => calls.push(options) };
  const target = controller.month;
  controller.handleMeasure(target, 600, 44);
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 600 } } });
  controller = render();
  assert.deepEqual(calls, []);
  controller.handleContentSizeChange(320, 1400);
  assert.deepEqual(calls, [{ y: 480, animated: false }]);
  calls.length = 0;
  controller.showDate(target);
  assert.deepEqual(calls, [{ y: 480, animated: true }]);
});

test('month transitions reset old content limits and resize uses the new viewport', () => {
  let controller = render();
  const calls = [];
  controller.scrollRef.current = { scrollTo: (options) => calls.push(options) };
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 600 } } });
  controller.handleContentSizeChange(320, 3000);
  controller.showDate('2027-02-28');
  controller = render();
  controller.handleMeasure('2027-02-28', 1188, 44);
  assert.deepEqual(calls, []);
  controller.handleContentSizeChange(320, 1788);
  assert.deepEqual(calls, [{ y: 1068, animated: false }]);
  calls.length = 0;
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 400 } } });
  controller.showDate('2027-02-28');
  assert.deepEqual(calls, [{ y: 1108, animated: true }]);
});

test('header month navigation at supported year boundaries reports an error without moving', () => {
  let view = render();
  view.showDate('0001-01-01');
  view = render();
  view.handleMonthChange(-1);
  assert.equal(render().month, '0001-01-01');
  view = render();
  view.showDate('9999-12-01');
  view = render();
  view.handleMonthChange(1);
  assert.equal(render().month, '9999-12-01');
  assert.equal(notices.length, 2);
});

test('month-end navigation clamps to real content and does not keep snapping back', () => {
  let controller = render();
  const calls = [];
  controller.scrollRef.current = { scrollTo: (options) => calls.push(options) };
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 600 } } });
  controller.showDate('2027-02-28');
  controller = render();
  controller.handleMeasure('2027-02-28', 1188, 44);
  controller.handleContentSizeChange(320, 1308);
  assert.deepEqual(calls.at(-1), { y: 708, animated: false });
  calls.length = 0;
  controller.handleContentSizeChange(320, 1320);
  controller.handleMeasure('2027-02-28', 1200, 44);
  assert.deepEqual(calls, []);
});
