const assert = require('node:assert/strict');
const { test } = require('node:test');
const { applyDailyNote, state } = require('../support/planner.cjs');

test('settings asks for confirmation before deleting every alarm', async () => {
  const { useAlarmSettings } = require('../../src/features/settings/hooks/useAlarmSettings.ts');
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '13:00 회의,14:00 식사',
    () => 'settings-' + id++,
  );
  state.plannerData = {
    ...state.plannerData,
    dailyPlanItems: state.plannerData.dailyPlanItems.map((item) => ({ ...item, alarm: true })),
  };
  state.cursor = 0;
  const settings = useAlarmSettings();
  settings.requestDelete();
  assert.equal(
    state.plannerData.dailyPlanItems.every((item) => item.alarm),
    true,
  );
  const dialog = state.alerts.at(-1);
  assert.equal(dialog.title, '모든 알람 삭제');
  assert.equal(dialog.actions[0].style, 'cancel');
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    state.plannerData.dailyPlanItems.some((item) => item.alarm),
    false,
  );
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time),
    ['13:00', '14:00'],
  );
  assert.equal(state.toasts.at(-1), '모든 알람을 삭제했어요.');
});
