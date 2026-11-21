const { assert, test, beforeEach } = require('../support/test.cjs');
const { centeredDateOffset } = require('../../src/features/planner/services/navigation.ts');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const hooks = createHookHarness();
const frames = require('../support/frames.cjs').createAnimationFrames();
global.requestAnimationFrame = frames.request;
global.cancelAnimationFrame = frames.cancel;
const mock = createModuleMock(require);
mock('react', hooks.react);
const notices = [];
mock('../../src/components/ui/index.tsx', { showToast: (message) => notices.push(message) });
const { useMonthNavigation } = require('../../src/features/planner/hooks/useMonthNavigation.ts');
function render() {
  // React 훅: 상태 유지 mock 실행.

  return hooks.render(useMonthNavigation);
}
beforeEach(() => {
  hooks.reset();
  frames.reset();
  notices.length = 0;
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
  frames.flush();
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
  frames.flush();
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
  frames.flush();
  assert.deepEqual(calls.at(-1), { y: 708, animated: false });
  calls.length = 0;
  controller.handleContentSizeChange(320, 1320);
  controller.handleMeasure('2027-02-28', 1200, 44);
  frames.flush();
  assert.deepEqual(calls, []);
});

test('launch waits for the first layout frame and uses the latest measurements for Today', () => {
  const controller = render();
  const calls = [];
  controller.scrollRef.current = { scrollTo: (options) => calls.push(options) };
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 600 } } });
  controller.handleMeasure(controller.month, 400, 44);
  controller.handleContentSizeChange(320, 1000);
  assert.deepEqual(calls, []);
  controller.handleMeasure(controller.month, 900, 44);
  controller.handleContentSizeChange(320, 2000);
  frames.flush();
  assert.deepEqual(calls, [{ y: 780, animated: false }]);
  controller.showDate(controller.month);
  assert.deepEqual(calls.at(-1), { y: 780, animated: true });
});

test('unmount cancels pending launch scrolling', () => {
  const controller = render();
  const calls = [];
  controller.scrollRef.current = { scrollTo: (options) => calls.push(options) };
  controller.handleMeasure(controller.month, 900, 44);
  controller.handleViewportLayout({ nativeEvent: { layout: { height: 600 } } });
  controller.handleContentSizeChange(320, 2000);
  hooks.unmount();
  frames.flush();
  assert.deepEqual(calls, []);
});
