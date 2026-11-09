require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../src/features/planner/types/index.ts');
function mock(id, exports) {
  const filename = require.resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
let id = 0;
mock('expo-crypto', { randomUUID: () => 'id-' + ++id });
mock('../src/database/repositories/planner.ts', { loadData: async () => emptyData() });
const writes = [];
let block;
let fail = false;
mock('../src/database/repositories/persist.ts', {
  persistData: async (data) => {
    writes.push(data);
    if (fail) {
      fail = false;
      throw Error('write failed');
    }
    if (block) await block;
  },
  restoreData: async (data) => {
    writes.push(data);
  },
});
const { usePlanner } = require('../src/stores/planner.ts');
const {
  initializePlanner,
  saveDailyNote,
  flushPlanner,
  restorePlanner,
  setDailyAlarms,
  saveDailyTimes,
} = require('../src/features/planner/controllers/planner.ts');
test('controller flush includes edits arriving while a prior save is in flight', async () => {
  await initializePlanner();
  let release;
  block = new Promise((resolve) => {
    release = resolve;
  });
  saveDailyNote('2026-11-07', '첫 입력');
  const pending = flushPlanner();
  await new Promise((resolve) => setImmediate(resolve));
  saveDailyNote('2026-11-07', '수정 입력');
  block = null;
  release();
  await pending;
  await flushPlanner();
  assert.equal(writes.at(-1).dailyPlanItems[0].content, '수정 입력');
  assert.equal(usePlanner.getState().dirty, false);
});
test('failed save retains in-memory input for retry and restore remains atomic', async () => {
  saveDailyNote('2026-11-07', '유지할 입력');
  fail = true;
  await assert.rejects(flushPlanner(), /write failed/);
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].content, '유지할 입력');
  assert.equal(usePlanner.getState().dirty, true);
  await flushPlanner();
  assert.equal(usePlanner.getState().error, null);
  await restorePlanner(emptyData());
  assert.deepEqual(usePlanner.getState().data, emptyData());
  assert.equal(usePlanner.getState().restoring, false);
});

test('clearing a selected time also disables its alarm without changing another chip', async () => {
  saveDailyNote('2026-11-08', '회의,식사');
  const items = usePlanner.getState().data.dailyPlanItems;
  const selected = new Set([items[0].id]);
  assert.throws(() => setDailyAlarms(selected, true), /알람 시간/);
  setDailyAlarms(selected, true, '13:10');
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].alarm, true);
  assert.equal(usePlanner.getState().data.dailyPlanItems[1].alarm, undefined);
  saveDailyTimes(selected, null);
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].alarm, undefined);
  await flushPlanner();
});

test('changing selected times clears only alarms whose scheduled times change', async () => {
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  saveDailyNote('2026-11-09', '13:00 회의,14:00 식사,18:00 운동,독서');
  const items = usePlanner.getState().data.dailyPlanItems;
  setDailyAlarms(new Set(items.slice(0, 3).map((item) => item.id)), true);
  const selected = new Set([items[0].id, items[1].id, items[3].id]);
  saveDailyTimes(selected, '13:00');
  const changed = usePlanner.getState().data.dailyPlanItems;
  assert.deepEqual(
    changed.map((item) => item.time),
    ['13:00', '13:00', '18:00', '13:00'],
  );
  assert.deepEqual(
    changed.map((item) => Boolean(item.alarm)),
    [true, false, true, false],
  );
  await flushPlanner();
  assert.deepEqual(
    writes.at(-1).dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, false, true, false],
  );
});
