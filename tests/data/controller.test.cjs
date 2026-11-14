const { createModuleMock } = require('../support/mock-module.cjs');
require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const mock = createModuleMock(require);
let id = 0;
mock('expo-crypto', { randomUUID: () => 'id-' + ++id });
mock('../../src/database/repositories/planner.ts', { loadData: async () => emptyData() });
const writes = [];
let block;
let fail = false;
mock('../../src/database/repositories/persist.ts', {
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
const { usePlanner } = require('../../src/stores/planner.ts');
const {
  initializePlanner,
  saveDailyNote,
  finishDailyNote,
  flushPlanner,
  restorePlanner,
  setDailyAlarms,
  saveDailyTimes,
} = require('../../src/features/planner/controllers/planner.ts');
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

test('invalid user input is rejected before planner state or persistence changes', async () => {
  const {
    saveHolidayOverride,
    saveRecurring,
    saveException,
  } = require('../../src/features/planner/controllers/planner.ts');
  const data = emptyData();
  usePlanner.setState({ ready: true, restoring: false, data, dirty: false });
  const plan = {
    id: 'validation',
    title: '정상 일정',
    time: '09:00',
    startDate: '2026-11-01',
    endDate: null,
    weekdays: [1],
    holidayPolicy: 'include',
  };
  const invalid = [
    () => saveDailyNote('2026-02-30', '날짜 오류'),
    () => saveDailyNote('2026-11-12', '가'.repeat(256)),
    () => saveHolidayOverride('2026-02-30', '날짜 오류'),
    () => saveHolidayOverride('2026-11-12', ' '),
    () => saveHolidayOverride('2026-11-12', '😀'.repeat(256)),
    () => saveRecurring({ ...plan, title: '가'.repeat(256) }),
    () => saveRecurring({ ...plan, title: ' ' }),
    () => saveRecurring({ ...plan, time: '24:00' }),
    () => saveRecurring({ ...plan, weekdays: [] }),
    () => saveRecurring({ ...plan, endDate: '2026-10-31' }),
    () =>
      saveException('validation', '2026-11-12', {
        recurringPlanId: 'validation',
        date: '2026-11-12',
        cancelled: false,
        title: '가'.repeat(256),
      }),
  ];
  for (const action of invalid) {
    assert.throws(action);
    assert.equal(usePlanner.getState().data, data);
    assert.equal(usePlanner.getState().dirty, false);
  }
  saveHolidayOverride('2028-02-29', '윤일');
  saveRecurring(plan);
  assert.equal(usePlanner.getState().data.holidayOverrides[0].date, '2028-02-29');
  assert.equal(usePlanner.getState().data.recurringPlans[0].id, 'validation');
  await flushPlanner();
});

test('finishing a schedule persists clean content and removes trailing empty items', async () => {
  const date = '2026-11-19';
  saveDailyNote(date, '13:10 회의  내용  , , 운동 ,');
  const original = usePlanner.getState().data.dailyPlanItems.filter((item) => item.date === date);
  setDailyAlarms(new Set([original[0].id]), true, '13:10');
  finishDailyNote(date);
  await flushPlanner();
  const saved = writes.at(-1).dailyPlanItems.filter((item) => item.date === date);
  assert.deepEqual(
    saved.map((item) => item.content),
    ['회의  내용', '운동'],
  );
  assert.equal(saved[0].id, original[0].id);
  assert.equal(saved[0].alarm, true);
  assert.equal(saved[0].time, '13:10');
});

test('typing a burst publishes once and flush includes drafts before the debounce expires', async () => {
  const { stageDailyNote } = require('../../src/features/planner/controllers/planner.ts');
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  const before = usePlanner.getState().data;
  let publications = 0;
  const unsubscribe = usePlanner.subscribe((state, previous) => {
    if (state.data !== previous.data) publications++;
  });
  for (let index = 1; index <= 100; index++) {
    stageDailyNote('2026-11-20', 'a'.repeat(index), true);
  }
  assert.equal(usePlanner.getState().data, before);
  assert.equal(publications, 0);
  await flushPlanner(); // Also used when the app goes into the background.
  assert.equal(publications, 1);
  assert.equal(writes.at(-1).dailyPlanItems[0].content, 'a'.repeat(100));
  assert.equal(usePlanner.getState().dirty, false);
  unsubscribe();
});

test('drafts from multiple dates commit before a subsequent command and retain selection IDs', async () => {
  const {
    stageDailyNote,
    commitPlannerChanges,
  } = require('../../src/features/planner/controllers/planner.ts');
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  saveDailyNote('2026-11-21', '13:10 meeting,meal');
  const id = usePlanner.getState().data.dailyPlanItems[0].id;
  stageDailyNote('2026-11-21', '13:10 updated meeting,meal', true);
  stageDailyNote('2026-11-22', 'next day', true);
  commitPlannerChanges();
  setDailyAlarms(new Set([id]), true);
  assert.equal(
    usePlanner.getState().data.dailyPlanItems.find((item) => item.id === id).content,
    'updated meeting',
  );
  assert.equal(
    usePlanner.getState().data.dailyPlanItems.find((item) => item.id === id).alarm,
    true,
  );
  stageDailyNote('2026-11-22', ' trimmed , ,', true);
  finishDailyNote('2026-11-22');
  assert.deepEqual(
    usePlanner
      .getState()
      .data.dailyPlanItems.filter((item) => item.date === '2026-11-22')
      .map((item) => item.content),
    ['trimmed'],
  );
  await flushPlanner();
});

test('a pause publishes the latest draft automatically and restore cannot resurrect stale drafts', async () => {
  const { stageDailyNote } = require('../../src/features/planner/controllers/planner.ts');
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  stageDailyNote('2026-11-23', 'autosave', true);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].content, 'autosave');
  stageDailyNote('2026-11-23', 'pending before restore', true);
  await restorePlanner(emptyData());
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.deepEqual(usePlanner.getState().data, emptyData());
  assert.throws(() => stageDailyNote('2026-02-30', 'invalid'));
  await flushPlanner();
});

test('an in-flight save drains newly staged keystrokes before resolving', async () => {
  const { stageDailyNote } = require('../../src/features/planner/controllers/planner.ts');
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  let release;
  block = new Promise((resolve) => {
    release = resolve;
  });
  stageDailyNote('2026-11-24', 'first', true);
  const saving = flushPlanner();
  await new Promise((resolve) => setImmediate(resolve));
  stageDailyNote('2026-11-24', 'latest', true);
  block = null;
  release();
  await saving;
  assert.equal(writes.at(-1).dailyPlanItems[0].content, 'latest');
  assert.equal(usePlanner.getState().dirty, false);
});

test('a rejected command retains pending input for the next save', async () => {
  const { stageDailyNote } = require('../../src/features/planner/controllers/planner.ts');
  usePlanner.setState({ ready: true, restoring: false, data: emptyData(), dirty: false });
  saveDailyNote('2026-11-25', 'existing');
  const id = usePlanner.getState().data.dailyPlanItems[0].id;
  stageDailyNote('2026-11-25', 'keep this draft', true);
  assert.throws(() => setDailyAlarms(new Set([id]), true), /알람 시간/);
  await flushPlanner();
  assert.equal(writes.at(-1).dailyPlanItems[0].content, 'keep this draft');
});
