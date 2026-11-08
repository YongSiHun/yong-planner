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
