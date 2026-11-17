const { hooks } = require('../support/planner.cjs');
const { assert, test } = require('../support/test.cjs');
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
  hooks.beginRender();
  const settings = useAlarmSettings();
  settings.requestDelete();
  assert.equal(
    state.plannerData.dailyPlanItems.every((item) => item.alarm),
    true,
  );
  const dialog = state.alerts.at(-1);
  assert.equal(dialog.title, '삭제하시겠습니까?');
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
