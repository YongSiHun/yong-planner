const { assert, test } = require('../support/test.cjs');
const { moveDailyNote } = require('../../src/features/planner/services/noteMove.ts');
const { applyDailyNote, dailyNoteItems } = require('../../src/features/planner/services/note.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { dropTarget } = require('../../src/features/planner/services/dragGeometry.ts');
const { createModuleMock } = require('../support/mock-module.cjs');
const mock = createModuleMock(require);
mock('react-native', {
  Animated: {
    Value: class {
      constructor(value) {
        this.value = value;
      }
      setValue(value) {
        this.value = value;
      }
    },
    ValueXY: class {
      setValue(value) {
        this.value = value;
      }
    },
  },
  PanResponder: { create: (config) => ({ config, panHandlers: {} }) },
});
const { ChipDragSession } = require('../../src/features/planner/hooks/ChipDragSession.ts');
const boxes = new Map([
  [0, { x: 0, y: 0, width: 80, height: 30 }],
  [1, { x: 86, y: 0, width: 80, height: 30 }],
  [2, { x: 0, y: 36, width: 100, height: 30 }],
]);
test('reordering preserves IDs, time, other dates and recurrence positions', () => {
  let id = 0;
  const date = '2026-11-07';
  let data = applyDailyNote(emptyData(), date, '13:10 회의,장보기,운동', () => String(++id));
  data = applyDailyNote(data, '2026-11-08', '다른 날', () => String(++id));
  data.dailyPlanOrders[0].itemIds.splice(1, 0, 'recurring:repeat');
  const before = data.dailyPlanItems;
  const originalOrder = dailyNoteItems(data, date);
  const originalIds = originalOrder.map((item) => item.id);
  const moved = moveDailyNote(data, date, 0, 3);
  assert.equal(moved.dailyPlanItems, before);
  assert.deepEqual(
    originalOrder.map((item) => item.id),
    originalIds,
  );
  assert.deepEqual(
    dailyNoteItems(data, date).map((item) => item.id),
    originalIds,
  );
  assert.deepEqual(
    dailyNoteItems(moved, date).map((item) => item.content),
    ['장보기', '운동', '회의'],
  );
  assert.equal(dailyNoteItems(moved, date)[2].time, '13:10');
  assert.equal(
    moved.dailyPlanOrders.find((order) => order.date === date).itemIds[1],
    'recurring:repeat',
  );
  assert.equal(moveDailyNote(data, date, 0, 1), data);
  assert.equal(moveDailyNote(data, date, 0, 99), data);
  assert.deepEqual(
    dailyNoteItems(moved, '2026-11-08').map((item) => item.content),
    ['다른 날'],
  );
});

test('drop marker follows chip halves and wrapped rows using the actual drop boundary', () => {
  assert.deepEqual(dropTarget(boxes, 2, 15), { boundary: 0, x: -3, y: 0, height: 30 });
  assert.deepEqual(dropTarget(boxes, 150, 15), { boundary: 2, x: 169, y: 0, height: 30 });
  assert.deepEqual(dropTarget(boxes, 90, 50), { boundary: 3, x: 103, y: 36, height: 30 });
  assert.equal(dropTarget(new Map(), 0, 0), null);
});

test('drag marker updates without React renders and releases at the indicated boundary', () => {
  const snapshots = [];
  const moves = [];
  const session = new ChipDragSession((value) => snapshots.push(value));
  session.setOnMove((...args) => moves.push(args));
  boxes.forEach((box, index) => session.record(index, { nativeEvent: { layout: box } }));
  const handlers = session.pan.config;
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(), false);
  session.arm(0);
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(null, { dx: 1, dy: 0 }), true);
  handlers.onPanResponderGrant();
  handlers.onPanResponderMove(null, { dx: 110, dy: 0 });
  assert.deepEqual(session.markerOffset.value, { x: 169, y: 0 });
  assert.equal(session.markerHeight.value, 30);
  handlers.onPanResponderMove(null, { dx: 50, dy: 36 });
  assert.deepEqual(session.markerOffset.value, { x: 103, y: 36 });
  assert.equal(snapshots.length, 1);
  assert.equal(moves.length, 0);
  session.releaseArm();
  handlers.onPanResponderRelease(null, { dx: 50, dy: 36 });
  assert.deepEqual(moves, [[0, 3]]);
  assert.equal(session.markerHeight.value, 0);
  assert.equal(snapshots.at(-1), null);
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(), false);
  session.setCount(1);
  assert.equal(session.boxes.size, 1);
});

test('cancelling a drag hides its insertion marker without changing order', () => {
  const moves = [];
  const session = new ChipDragSession(() => {});
  session.setOnMove((...args) => moves.push(args));
  session.record(0, { nativeEvent: { layout: boxes.get(0) } });
  session.arm(0);
  session.pan.config.onPanResponderGrant();
  assert.equal(session.markerHeight.value, 30);
  session.pan.config.onPanResponderTerminate();
  assert.equal(session.markerHeight.value, 0);
  assert.deepEqual(moves, []);
});

test('only the single selected chip can be armed or dropped', () => {
  let selected = new Set();
  const moves = [];
  const session = new ChipDragSession(
    () => {},
    (index) => selected.size === 1 && selected.has(index),
  );
  boxes.forEach((box, index) => session.record(index, { nativeEvent: { layout: box } }));
  session.setOnMove((...args) => moves.push(args));
  const handlers = session.pan.config;
  for (const selection of [new Set(), new Set([0, 1]), new Set([1])]) {
    selected = selection;
    session.arm(0);
    assert.equal(handlers.onMoveShouldSetPanResponderCapture(), false);
  }
  selected = new Set([0]);
  session.arm(0);
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(), true);
  handlers.onPanResponderGrant();
  selected = new Set([0, 1]);
  handlers.onPanResponderRelease(null, { dx: 110, dy: 0 });
  assert.deepEqual(moves, []);
  selected = new Set([0]);
  session.arm(0);
  handlers.onPanResponderGrant();
  handlers.onPanResponderRelease(null, { dx: 110, dy: 0 });
  assert.deepEqual(moves, [[0, 2]]);
});

test('arming a long press locks native scrolling before the first move and restores it after drop', () => {
  const locks = [];
  const moves = [];
  const session = new ChipDragSession(() => {});
  session.setOnScrollLock((locked) => locks.push(locked));
  session.setOnMove((...args) => moves.push(args));
  boxes.forEach((box, index) => session.record(index, { nativeEvent: { layout: box } }));
  session.arm(0);
  assert.deepEqual(locks, [true]);
  session.arm(0);
  assert.deepEqual(locks, [true]);
  const handlers = session.pan.config;
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(), true);
  handlers.onPanResponderGrant();
  session.releaseArm();
  assert.deepEqual(locks, [true]);
  handlers.onPanResponderRelease(null, { dx: 110, dy: 0 });
  assert.deepEqual(moves, [[0, 2]]);
  assert.deepEqual(locks, [true, false]);
});

test('long press without movement, interruption and unmount all unlock scrolling without reordering', () => {
  const locks = [];
  const moves = [];
  const session = new ChipDragSession(() => {});
  session.setOnScrollLock((locked) => locks.push(locked));
  session.setOnMove((...args) => moves.push(args));
  session.record(0, { nativeEvent: { layout: boxes.get(0) } });
  session.arm(0);
  session.releaseArm();
  assert.deepEqual(locks, [true, false]);
  session.arm(0);
  session.pan.config.onPanResponderGrant();
  session.pan.config.onPanResponderTerminate();
  assert.deepEqual(locks, [true, false, true, false]);
  session.arm(0);
  session.cancel();
  assert.deepEqual(locks, [true, false, true, false, true, false]);
  session.arm(99);
  assert.equal(locks.length, 6);
  assert.deepEqual(moves, []);
});

test('rejected gestures and failed drops restore scrolling', () => {
  let allowed = true;
  const locks = [];
  const session = new ChipDragSession(
    () => {},
    () => allowed,
  );
  session.setOnScrollLock((locked) => locks.push(locked));
  session.record(0, { nativeEvent: { layout: boxes.get(0) } });
  session.arm(0);
  allowed = false;
  session.pan.config.onPanResponderGrant();
  assert.deepEqual(locks, [true, false]);
  allowed = true;
  session.arm(0);
  session.pan.config.onPanResponderReject();
  assert.deepEqual(locks, [true, false, true, false]);
  session.arm(0);
  session.pan.config.onPanResponderGrant();
  session.setOnMove(() => {
    throw new Error('drop failed');
  });
  assert.throws(
    () => session.pan.config.onPanResponderRelease(null, { dx: 100, dy: 0 }),
    /drop failed/,
  );
  assert.deepEqual(locks, [true, false, true, false, true, false]);
});

test('unmounting a day while its chip is armed releases the native scroll lock', () => {
  const { createHookHarness } = require('../support/hooks.cjs');
  const hooks = createHookHarness();
  mock('react', hooks.react);
  let id = 0;
  const date = '2026-11-07';
  const data = applyDailyNote(emptyData(), date, '회의,운동', () => String(++id));
  mock('../../src/stores/planner.ts', { usePlanner: { getState: () => ({ data }) } });
  mock('../../src/stores/noteSelection.ts', {
    useNoteSelectionStore: { getState: () => ({ selected: new Set([data.dailyPlanItems[0].id]) }) },
  });
  const { useChipDrag } = require('../../src/features/planner/hooks/useChipDrag.ts');
  const locks = [];
  const drag = hooks.render(() =>
    useChipDrag(
      () => assert.fail('unexpected move'),
      2,
      date,
      (locked) => locks.push(locked),
    ),
  );
  drag.record(0, { nativeEvent: { layout: boxes.get(0) } });
  drag.arm(0);
  assert.deepEqual(locks, [true]);
  hooks.unmount();
  assert.deepEqual(locks, [true, false]);
});
