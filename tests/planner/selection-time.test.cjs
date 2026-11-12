const assert = require('node:assert/strict');
const { test } = require('node:test');
const { applyDailyNote, renderSelection, state } = require('../support/planner.cjs');

test('single selection sets time independently of schedule content', () => {
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-07', '밥먹기', () => 'meal');

  let selection = renderSelection();
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection();
  selection.openTime();
  selection = renderSelection();
  assert.equal(selection.timeSource.content, '밥먹기');
  selection.saveTime('13:00');
  assert.equal(state.plannerData.dailyPlanItems[0].time, '13:00');
  assert.equal(state.plannerData.dailyPlanItems[0].content, '밥먹기');
});

test('multi-selection sets, overwrites and clears time on selected chips', () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의,밥먹기,운동',
    () => 'multi-' + ++id,
  );
  let selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  selection.openTime();
  selection = renderSelection();
  selection.saveTime('13:10');
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:10', '13:10', null],
  );
  selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  selection.openTime();
  renderSelection().saveTime('14:20');
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['14:20', '14:20', null],
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  renderSelection().openTime();
  renderSelection().saveTime(null);
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    [null, null, null],
  );
});

test('selected chips can overwrite their existing alarm times together', async () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의,식사,운동',
    () => 'alarm-' + ++id,
  );
  let selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  renderSelection().toggleAlarm();
  selection = renderSelection();
  assert.equal(selection.alarmSetting, true);
  assert.equal(selection.timeSource.id, 'alarm-1');
  selection.saveTime('13:10');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.alarmPermissionRequests, 1);
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, false],
  );
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:10', '13:10', null],
  );
  selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  assert.equal(selection.hasSelectedAlarm, true);
  selection.toggleAlarm();
  assert.equal(renderSelection().alarmSetting, true);
  renderSelection().saveTime('15:30');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['15:30', '15:30', null],
  );
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, false],
  );
  assert.equal(state.alarmPermissionRequests, 2);
});

test('denied alarm permission keeps the editor and selected schedules unchanged and shows a toast', async () => {
  state.toasts = [];
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-08', '회의', () => 'denied-alarm');
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggleAlarm();
  const before = state.plannerData;
  const selected = renderSelection();
  state.alarmPermissionError = new Error('알림 권한이 없어 알람을 저장하지 않았어요.');
  selected.saveTime('13:10');
  await new Promise((resolve) => setImmediate(resolve));
  const after = renderSelection();
  assert.equal(after.alarmSetting, true);
  assert.equal(after.timeSource.id, 'denied-alarm');
  assert.equal(state.plannerData, before);
  assert.deepEqual(state.toasts, [state.alarmPermissionError.message]);
  assert.equal(state.alerts.length, 0);
  state.alarmPermissionError = null;
  after.saveTime('13:10');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.plannerData.dailyPlanItems[0].alarm, true);
  assert.equal(state.plannerData.dailyPlanItems[0].time, '13:10');
  assert.equal(renderSelection().alarmSetting, false);
});
