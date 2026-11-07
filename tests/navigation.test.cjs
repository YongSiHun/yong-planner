require('./register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { centeredDateOffset } = require('../src/features/planner/services/navigation.ts');
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
const { useMonthNavigation } = require('../src/features/planner/hooks/useMonthNavigation.ts');
function render() {
  cursor = 0;
  // React 훅을 위의 상태 보존 테스트 대역으로 실행한다.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMonthNavigation();
}
beforeEach(() => {
  slots = [];
  cursor = 0;
});

test('middle dates are centered for different row and screen heights', () => {
  for (const viewport of [320, 600, 900]) {
    for (const height of [44, 88, 180]) {
      const y = 1000;
      const offset = centeredDateOffset(y, height, viewport, 3000);
      assert.equal(y + height / 2 - offset, viewport / 2);
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
  assert.deepEqual(calls, [{ y: 322, animated: false }]);
  calls.length = 0;
  controller.showDate(target);
  assert.deepEqual(calls, [{ y: 322, animated: true }]);
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
  controller.handleContentSizeChange(320, 1308);
  assert.deepEqual(calls, [{ y: 708, animated: false }]);
  calls.length = 0;
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 400 } } });
  controller.showDate('2027-02-28');
  assert.deepEqual(calls, [{ y: 908, animated: true }]);
});
