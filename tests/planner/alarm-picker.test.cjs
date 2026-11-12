const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  SelectionBar,
  applyDailyNote,
  find,
  renderSelection,
  state,
} = require('../support/planner.cjs');

test('alarm modal applies and aligns all selected schedule times without an overwrite notice', async () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '13:00 회의,14:00 운동,독서,18:00 식사',
    () => 'alarm-overwrite-' + ++id,
  );
  state.plannerData = {
    ...state.plannerData,
    dailyPlanItems: state.plannerData.dailyPlanItems.map((item, index) =>
      index === 1 ? { ...item, alarm: true } : item,
    ),
  };
  for (const index of [0, 1, 2]) renderSelection().toggle('2026-11-08', index, index === 0);
  const selection = renderSelection();
  const bar = SelectionBar({ count: 3, onAlarm: selection.toggleAlarm });
  const alarmButton = find(
    bar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '알람 설정',
  );
  assert.equal(alarmButton.props.disabled, false);
  alarmButton.props.onPress();
  const opened = renderSelection();
  assert.equal(opened.alarmSetting, true);
  state.slots = [];
  state.cursor = 0;
  const dialog = TimePicker({
    item: opened.timeSource,
    format: '24h',
    count: 3,
    hasExistingTime: false,
    onClose: opened.closeTime,
    onSave: opened.saveTime,
  });
  assert.equal(
    find(dialog.props.footer, (node) => node.type === 'Button' && node.props.title === '적용').props
      .title,
    '적용',
  );
  assert.equal(state.plannerData.dailyPlanItems[1].time, '14:00');
  assert.equal(state.alarmPermissionRequests, 0);
  find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:00', '13:00', '13:00', '18:00'],
  );
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, true, false],
  );
});

test('time and alarm clear actions share footer styling and alarm clearing preserves schedule time', async () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  let nextId = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '13:00 회의,14:00 식사',
    () => 'clear-' + nextId++,
  );
  state.plannerData = {
    ...state.plannerData,
    dailyPlanItems: state.plannerData.dailyPlanItems.map((item, index) => ({
      ...item,
      id: 'clear-' + index,
      alarm: true,
    })),
  };
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggleAlarm();
  const selection = renderSelection();
  state.slots = [];
  state.cursor = 0;
  const dialog = TimePicker({
    item: selection.timeSource,
    items: selection.selectedItems,
    format: '24h',
    hasExistingTime: true,
    clearTitle: '알람 지우기',
    onClose: selection.closeTime,
    onSave: selection.saveTime,
  });
  const remove = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '알람 지우기',
  );
  const apply = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  );
  assert.equal(remove.props.bold, true);
  assert.equal(remove.props.style, apply.props.style);
  assert.equal(remove.props.compact, undefined);
  assert.ok(find(dialog, (node) => node.type === 'Label' && node.props.children === '13시 회의'));
  remove.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.plannerData.dailyPlanItems[0].alarm, undefined);
  assert.equal(state.plannerData.dailyPlanItems[0].time, '13:00');
  assert.equal(state.plannerData.dailyPlanItems[1].alarm, true);
  assert.equal(state.alarmPermissionRequests, 0);
});
