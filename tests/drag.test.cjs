require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { moveDailyNote } = require('../src/features/planner/services/noteMove.ts');
const { applyDailyNote, dailyNoteItems } = require('../src/features/planner/services/note.ts');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { dropBoundary } = require('../src/features/planner/services/dragGeometry.ts');
const native = require.resolve('react-native');
require.cache[native] = {
  id: native,
  filename: native,
  loaded: true,
  exports: {
    Animated: {
      ValueXY: class {
        setValue(value) {
          this.value = value;
        }
      },
    },
    PanResponder: { create: (config) => ({ config, panHandlers: {} }) },
  },
};
const { ChipDragSession } = require('../src/features/planner/hooks/ChipDragSession.ts');
const boxes = new Map([
  [0, { x: 0, y: 0, width: 80, height: 30 }],
  [1, { x: 86, y: 0, width: 80, height: 30 }],
  [2, { x: 0, y: 36, width: 100, height: 30 }],
]);
test('drop targets honor wrapped rows and chip halves', () => {
  assert.equal(dropBoundary(boxes, 2, 15), 0);
  assert.equal(dropBoundary(boxes, 150, 15), 2);
  assert.equal(dropBoundary(boxes, 90, 50), 3);
  assert.equal(dropBoundary(new Map(), 1, 1), null);
});
test('drag frames update translation without rendering or saving until release', () => {
  const snapshots = [];
  const moves = [];
  const session = new ChipDragSession((value) => snapshots.push(value));
  session.setOnMove((...args) => moves.push(args));
  boxes.forEach((box, index) => session.record(index, { nativeEvent: { layout: box } }));
  const handlers = session.pan.config;
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(null, { dx: 20, dy: 0 }), false);
  session.arm(0);
  assert.equal(handlers.onMoveShouldSetPanResponderCapture(null, { dx: 9, dy: 0 }), true);
  handlers.onPanResponderGrant();
  for (let frame = 0; frame < 120; frame++) handlers.onPanResponderMove(null, { dx: frame, dy: 0 });
  assert.equal(snapshots.length, 1);
  assert.equal(moves.length, 0);
  session.releaseArm();
  handlers.onPanResponderRelease(null, { dx: 110, dy: 0 });
  assert.deepEqual(moves, [[0, 2]]);
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots.at(-1), null);
  session.setCount(1);
  assert.equal(session.boxes.size, 1);
});
test('cancelled dragging does not reorder schedules', () => {
  const session = new ChipDragSession(() => {});
  const moves = [];
  session.setOnMove((...args) => moves.push(args));
  session.record(0, { nativeEvent: { layout: boxes.get(0) } });
  session.arm(0);
  session.pan.config.onPanResponderGrant();
  session.pan.config.onPanResponderTerminate();
  assert.deepEqual(moves, []);
});
test('reordering preserves IDs, time, other dates and recurrence positions', () => {
  let id = 0;
  const date = '2026-11-07';
  let data = applyDailyNote(emptyData(), date, '13:10 회의,장보기,운동', () => String(++id));
  data = applyDailyNote(data, '2026-11-08', '다른 날', () => String(++id));
  data.dailyPlanOrders[0].itemIds.splice(1, 0, 'recurring:repeat');
  const before = data.dailyPlanItems;
  const moved = moveDailyNote(data, date, 0, 3);
  assert.equal(moved.dailyPlanItems, before);
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
