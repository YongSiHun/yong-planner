const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  DayDate,
  ScheduleChip,
  SchedulePreview,
  SelectionBar,
  applyDailyNote,
  boundary,
  buttonTitles,
  find,
  renderInput,
  renderSelection,
  state,
} = require('../support/planner.cjs');

test('long press starts selection and selected chip taps toggle without editing', () => {
  const toggles = [];
  const edits = [];
  const preview = SchedulePreview({
    note: '회의,장보기,운동',
    date: '2026-11-07',
    isToday: true,
    selecting: true,
    selectedIndexes: new Set([1]),
    onSelect: (...args) => toggles.push(args),
    onEdit: (index) => edits.push(index),
  });
  const chip = find(
    preview,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  const button = ScheduleChip(chip.props);
  button.props.onLongPress();
  button.props.onPress();
  assert.deepEqual(toggles, [[1, true], [1]]);
  assert.deepEqual(edits, []);
  assert.equal(chip.props.selected, true);
});

test('single and multiple selections offer the same actions', () => {
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-07',
    '회의,장보기',
    () => 'item-' + state.nativeEventCount++,
  );

  let selection = renderSelection();
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection();
  assert.equal(selection.selected.size, 1);
  let bar = SelectionBar({ count: 1, onEdit() {}, onCopy() {}, onDelete() {}, onCancel() {} });
  assert.deepEqual(buttonTitles(bar), ['시간 설정', '일정 복사', '알람 설정', '삭제']);
  selection.toggle('2026-11-07', 1);
  selection = renderSelection();
  bar = SelectionBar({ count: 2, onEdit() {}, onCopy() {}, onDelete() {}, onCancel() {} });
  assert.deepEqual(buttonTitles(bar), ['시간 설정', '일정 복사', '알람 설정', '삭제']);
  selection.requestDelete();
  assert.equal(state.plannerData.dailyPlanItems.length, 2);
  selection = renderSelection();
  selection.deleteSelected();
  assert.equal(state.plannerData.dailyPlanItems.length, 0);
});

test('an unsaved cursor slot does not shift the ID selected by long press', () => {
  const selected = [];
  const onSelect = (...args) => selected.push(args);
  let editor = renderInput('회의,장보기', 0, onSelect);
  find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  ).props.onBefore();
  editor = renderInput('회의,장보기', 0, onSelect);
  const chip = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  chip.props.onLongPress();
  assert.deepEqual(selected, [[1, true]]);
  chip.props.onPress();
  editor = renderInput('회의,장보기', 0, onSelect);
  assert.equal(editor.input.props.value, boundary + '장보기');
  assert.deepEqual(state.saved, []);
});

test('canceling delete confirmation retains both schedules and selection', () => {
  let id = 0;
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-07', '회의,운동', () =>
    String(++id),
  );

  let selection = renderSelection();
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection();
  selection.requestDelete();
  selection = renderSelection();
  assert.equal(selection.deleteCount, 1);
  selection.cancelDelete();
  selection = renderSelection();
  selection.deleteSelected();
  assert.equal(state.plannerData.dailyPlanItems.length, 2);
  assert.equal(selection.selected.size, 1);
});

test('selection keeps chip edges mounted and tapping them toggles selection', () => {
  let toggles = 0;
  state.cursor = 0;
  const button = ScheduleChip({
    content: '밥먹기',
    selecting: true,
    selected: true,
    onPress: () => toggles++,
    onLongPress() {},
    onBefore: () => assert.fail('unexpected insertion'),
    onAfter: () => assert.fail('unexpected insertion'),
  });
  const group = find(button, (node) => node.type?.name === 'ChipEdges');
  const edges = group.type(group.props).props.children;
  assert.equal(edges.length, 2);
  for (const edge of edges) {
    edge.type(edge.props).props.onPress();
  }
  assert.equal(toggles, 2);
});

test('marking selected schedules important affects only those chips and supports clearing', () => {
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '회의,밥먹기,운동',
    () => 'star-' + ++id,
  );
  let selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  selection.toggleImportant();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => Boolean(item.important)),
    [true, true, false],
  );
  selection = renderSelection();
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  assert.equal(selection.allImportant, true);
  selection.toggleImportant();
  assert.equal(
    state.plannerData.dailyPlanItems.some((item) => item.important),
    false,
  );
});

test('selection exits on schedule whitespace while chip taps keep toggling selected items', () => {
  let id = 0;
  const date = '2026-11-08';
  state.plannerData = applyDailyNote(state.plannerData, date, '회의,운동', () => 'outside-' + ++id);
  renderSelection().toggle(date, 0, true);
  renderSelection().toggle(date, 1);
  const selection = renderSelection();
  const tree = SchedulePreview({
    note: '회의,운동',
    date,
    selecting: true,
    onEdit: () => assert.fail('selection must not start editing'),
    onSelect: (index) => renderSelection().toggle(date, index),
    onOutsidePress: selection.clear,
  });
  find(tree, (node) => node.type === ScheduleChip).props.onPress();
  assert.equal(renderSelection().selected.size, 1);
  assert.equal(renderSelection().active, true);
  tree.props.onPress();
  assert.equal(renderSelection().selected.size, 0);
  assert.equal(renderSelection().active, false);
});

test('empty days and date labels dismiss selection without opening input or date information', () => {
  const date = '2026-11-08';
  state.plannerData = applyDailyNote(state.plannerData, date, '회의', () => 'empty-outside');
  const select = () => renderSelection().toggle(date, 0, true);
  select();
  SchedulePreview({
    note: '',
    date,
    selecting: true,
    onEdit: () => assert.fail('selection must not start editing'),
    onOutsidePress: renderSelection().clear,
  }).props.onPress();
  assert.equal(renderSelection().active, false);
  select();
  DayDate({
    date,
    holidayName: '기념일',
    selecting: true,
    copying: false,
    isToday: false,
    copyTarget: false,
    copySource: false,
    onCopyDate: () => assert.fail('not copying'),
    onInfo: () => assert.fail('selection dismissal takes priority'),
    onFinish: () => assert.fail('selection dismissal takes priority'),
    onOutsidePress: renderSelection().clear,
  }).props.onPress();
  assert.equal(renderSelection().active, false);
});

test('selection bar omits selection count and bulk selection controls', () => {
  state.cursor = 0;
  const tree = SelectionBar({ count: 3 });
  assert.deepEqual(buttonTitles(tree), ['시간 설정', '일정 복사', '알람 설정', '삭제']);
  assert.equal(
    find(tree, (node) => node.type === 'Label'),
    undefined,
  );
});

test('selection bar has four evenly spaced actions without more', () => {
  const tree = SelectionBar({ count: 1 });
  assert.deepEqual(buttonTitles(tree), ['시간 설정', '일정 복사', '알람 설정', '삭제']);
  assert.equal(
    find(tree, (node) => node.type === 'Dialog'),
    undefined,
  );
});

test('selecting a chip only changes colors and never adds a checkmark or changes geometry', () => {
  const props = { content: '회의', important: true, alarm: true, onPress() {}, onLongPress() {} };
  const normal = ScheduleChip({ ...props, selected: false });
  const selected = ScheduleChip({ ...props, selected: true });
  const {
    backgroundColor: normalColor,
    borderColor: normalBorder,
    ...normalLayout
  } = normal.props.style({ pressed: false });
  const {
    backgroundColor: selectedColor,
    borderColor: selectedBorder,
    ...selectedLayout
  } = selected.props.style({ pressed: false });
  assert.notEqual(normalColor, selectedColor);
  assert.deepEqual(normalLayout, selectedLayout);
  assert.equal(
    normal.props.children.filter(Boolean).length,
    selected.props.children.filter(Boolean).length,
  );
  assert.equal(
    find(selected, (node) => node.props?.name === 'check'),
    undefined,
  );
  assert.ok(normalBorder);
  assert.ok(selectedBorder);
});
