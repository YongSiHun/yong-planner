const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  DayDate,
  DayRow,
  SelectionBar,
  applyDailyNote,
  find,
  renderSelection,
  state,
} = require('../support/planner.cjs');

test('copy mode selects dates on the current page and retains dates across navigation', () => {
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-07', '회의', () => 'source');
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '기존 일정',
    () => 'existing',
  );

  let selection = renderSelection();
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection();
  selection.openCopy();
  selection = renderSelection();
  assert.equal(selection.active, false);
  assert.equal(selection.copySource.content, '회의');
  selection.toggleCopyDate('2026-11-07');
  selection.toggleCopyDate('2026-11-08');
  selection = renderSelection();
  assert.deepEqual([...selection.copyDates], ['2026-11-08']);
  // 표시 월 변경 시 선택 날짜 유지.
  selection.toggleCopyDate('2026-12-01');
  selection = renderSelection();
  assert.deepEqual([...selection.copyDates], ['2026-11-08', '2026-12-01']);
  selection.copySelected();
  assert.deepEqual(
    state.plannerData.dailyPlanItems
      .filter((item) => item.date === '2026-11-08')
      .map((item) => item.content),
    ['기존 일정', '회의'],
  );
  assert.equal(
    state.plannerData.dailyPlanItems.filter((item) => item.date === '2026-12-01').length,
    1,
  );
  assert.equal(renderSelection().copySource, undefined);
});

test('copy mode picks a visible day row and makes existing schedules read only', () => {
  const picked = [];
  const edits = [];
  state.cursor = 0;
  const row = DayRow.type({
    date: '2026-11-08',
    note: '기존 일정',
    noteIds: ['existing'],
    selectedIds: new Set(),
    selecting: false,
    copying: true,
    copyTarget: true,
    copySourceDate: '2026-11-07',
    onCopyDate: (date) => picked.push(date),
    onSelect() {},
    recurring: [],
    exceptions: [],
    holidayName: null,
    isToday: false,
    isEditing: false,
    onEdit: (date) => edits.push(date),
    onFinish() {},
    onMeasure() {},
    onInputFocus() {},
    onInputLayout() {},
  });
  row.props.onPress();
  assert.deepEqual(picked, ['2026-11-08']);
  assert.deepEqual(edits, []);
  assert.ok(find(row, (node) => node.type === 'View' && node.props.pointerEvents === 'none'));
  const date = find(row, (node) => node.type?.name === 'DayDate');
  const badge = DayDate(date.props);
  assert.equal(badge.props.accessibilityState.checked, true);
});

test('multiple selected schedules enable copying and append behind existing target schedules', () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의,운동',
    () => 'source-' + ++id,
  );
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-09', '기존', () => 'existing');
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  const selection = renderSelection();
  const bar = SelectionBar({ count: 2, onCopy: selection.openCopy });
  const copy = find(
    bar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '일정 복사',
  );
  assert.equal(copy.props.disabled, false);
  copy.props.onPress();
  assert.equal(renderSelection().active, false);
  renderSelection().toggleCopyDate('2026-11-09');
  renderSelection().toggleCopyDate('2026-12-10');
  renderSelection().copySelected();
  assert.deepEqual(
    state.plannerData.dailyPlanItems
      .filter((item) => item.date === '2026-11-09')
      .map((item) => item.content),
    ['기존', '회의', '운동'],
  );
  assert.deepEqual(
    state.plannerData.dailyPlanItems
      .filter((item) => item.date === '2026-12-10')
      .map((item) => item.content),
    ['회의', '운동'],
  );
  assert.equal(renderSelection().copySource, undefined);
});

test('copy selection spans month and year boundaries and retains all chosen dates', () => {
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-08', '회의', () => 'cross-month');
  let selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  renderSelection().openCopy();
  for (const date of ['2026-11-30', '2026-12-01', '2027-01-01']) {
    renderSelection().toggleCopyDate(date);
  }
  selection = renderSelection();
  assert.deepEqual([...selection.copyDates], ['2026-11-30', '2026-12-01', '2027-01-01']);
  assert.equal(selection.copySource.id, 'cross-month');
  selection.copySelected();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.date),
    ['2026-11-08', '2026-11-30', '2026-12-01', '2027-01-01'],
  );
});

test('copying to a date that already includes the schedule shows a toast and does not select it', () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의',
    () => 'duplicate-' + ++id,
  );
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-09',
    '회의',
    () => 'duplicate-' + ++id,
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().openCopy();
  const before = state.toasts.length;
  const { DayDate } = require('../../src/features/planner/components/DayDate.tsx');
  const sourceDate = DayDate({
    date: '2026-11-08',
    holidayName: null,
    isToday: false,
    copying: true,
    copyTarget: false,
    copySource: true,
    onCopyDate: renderSelection().toggleCopyDate,
    onFinish() {},
    onInfo() {},
  });
  assert.notEqual(sourceDate.props.disabled, true);
  sourceDate.props.onPress();
  renderSelection().toggleCopyDate('2026-11-09');
  assert.equal(renderSelection().copyDates.size, 0);
  assert.equal(state.toasts.length, before + 2);
  assert.match(state.toasts.at(-1), /이미 같은 일정/);
});

test('copy rechecks changed targets before saving and preserves the selection on conflict', () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의',
    () => 'changed-' + ++id,
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().openCopy();
  renderSelection().toggleCopyDate('2026-11-09');
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-09',
    '회의',
    () => 'changed-' + ++id,
  );
  renderSelection().copySelected();
  assert.equal(state.plannerData.dailyPlanItems.length, 2);
  assert.match(state.toasts.at(-1), /이미 같은 일정/);
  assert.equal(renderSelection().copyDates.has('2026-11-09'), true);
  renderSelection().toggleCopyDate('2026-11-09');
  assert.equal(renderSelection().copyDates.size, 0);
});
