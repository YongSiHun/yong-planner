const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  DayRow,
  ScheduleChip,
  SchedulePreview,
  find,
  renderInput,
  state,
} = require('../support/planner.cjs');

test('blank space opens editing and an existing chip selects that chip', () => {
  const edits = [];
  const tree = SchedulePreview({
    note: '회의,장보기',
    date: '2026-11-07',
    isToday: true,
    onEdit: (index) => edits.push(index),
  });
  tree.props.onPress();
  find(tree, (node) => node.type?.name === 'ScheduleChip').props.onPress();
  assert.deepEqual(edits, [undefined, 0]);
  const editor = renderInput();
  editor.tree.props.onPress();
  assert.equal(state.focused, 1);
});

test('today empty preview is blank while keeping the row available for editing', () => {
  const edits = [];
  const tree = SchedulePreview({
    note: '',
    date: '2026-11-07',
    onEdit: (index) => edits.push(index),
  });
  assert.equal(
    find(tree, (node) => node.type === 'Text'),
    undefined,
  );
  tree.props.onPress();
  assert.deepEqual(edits, [0]);
});

test('saved time flows from the day row through the preview to the visible chip', () => {
  const props = {
    date: '2026-11-07',
    note: '밥먹기',
    noteIds: ['meal'],
    noteTimes: ['13:00'],
    timeFormat: '24h',
    selectedIds: new Set(),
    selecting: false,
    copying: false,
    copyTarget: false,
    recurring: [],
    exceptions: [],
    holidayName: null,
    isToday: false,
    isEditing: false,
    onCopyDate() {},
    onSelect() {},
    onEdit() {},
    onFinish() {},
    onMeasure() {},
    onInputFocus() {},
    onInputLayout() {},
  };
  for (const [format, label] of [
    ['24h', '13시 밥먹기'],
    ['12h', '오후 1시 밥먹기'],
  ]) {
    state.cursor = 0;
    const row = DayRow.type({ ...props, timeFormat: format });
    const preview = find(row, (node) => node.type?.name === 'DraggableSchedulePreview');
    const tree = SchedulePreview(preview.props);
    const chip = find(tree, (node) => node.type === ScheduleChip);
    assert.equal(
      find(ScheduleChip(chip.props), (node) => node.type === 'Text').props.children,
      label,
    );
  }
  assert.equal(DayRow.compare(props, { ...props, noteTimes: ['14:00'] }), false);
});

test('chips show typed time only once while the editor still holds the raw prefix', () => {
  const tree = ScheduleChip({
    content: '13:10 회의',
    time: '13:10',
    timeFormat: '12h',
    onPress() {},
    onLongPress() {},
  });
  assert.equal(find(tree, (node) => node.type === 'Text').props.children, '오후 1시 10분 회의');
});

test('long pressing either edge of the first chip arms dragging without inserting text', () => {
  const armed = [];
  const selected = [];
  const tree = SchedulePreview({
    note: '밥먹기,운동',
    date: '2026-11-07',
    onEdit: () => assert.fail('unexpected edit'),
    onInsert: () => assert.fail('unexpected insertion'),
    onArm: (index) => armed.push(index),
    onSelect: (...args) => selected.push(args),
  });
  const first = find(tree, (node) => node.type === ScheduleChip);
  state.cursor = 0;
  const button = ScheduleChip(first.props);
  const edgeGroup = find(button, (node) => node.type?.name === 'ChipEdges');
  const edges = edgeGroup.type(edgeGroup.props).props.children;
  for (const edge of edges) {
    edge.type(edge.props).props.onLongPress();
  }
  assert.deepEqual(armed, [0, 0]);
  assert.deepEqual(selected, [
    [0, true],
    [0, true],
  ]);
});

test('alarm marks follow schedule chips in both preview and editing', () => {
  const preview = SchedulePreview({
    note: '회의,식사',
    date: '2026-11-08',
    noteAlarms: [true, false],
    onEdit() {},
  });
  const chip = find(preview, (node) => node.type === ScheduleChip);
  assert.equal(chip.props.alarm, true);
  assert.match(ScheduleChip(chip.props).props.accessibilityLabel, /알람 설정됨/);
  const editor = renderInput('회의,식사', 1, () => {}, { noteAlarms: [true, false] });
  assert.equal(find(editor.tree, (node) => node.type === ScheduleChip).props.alarm, true);
});

test('unselected dates use the latest global selection mode without rerendering their row', () => {
  const edits = [];
  const selected = [];
  let dismissed = 0;
  const tree = SchedulePreview({
    note: '다른 날짜 일정',
    date: '2026-11-08',
    selecting: false,
    onEdit: (index) => edits.push(index),
    onSelect: (index) => selected.push(index),
    onInsert: (index) => edits.push(index),
    onOutsidePress: () => dismissed++,
  });
  state.selectionState = { ...state.selectionState, active: true };
  const chip = find(tree, (node) => node.type === ScheduleChip);
  chip.props.onPress();
  chip.props.onBefore();
  chip.props.onAfter();
  tree.props.onPress();
  assert.deepEqual(selected, [0, 0, 0]);
  assert.deepEqual(edits, []);
  assert.equal(dismissed, 1);
  assert.equal(ScheduleChip(chip.props).props.accessibilityRole, 'checkbox');
  state.selectionState = { ...state.selectionState, active: false };
  chip.props.onPress();
  assert.deepEqual(edits, [0]);
});

test('blank stored items create no phantom gaps and visible chip events retain their original indexes', () => {
  const edited = [];
  const tree = SchedulePreview({
    note: '회의, ,운동,,',
    date: '2026-11-07',
    onEdit: (index) => edited.push(index),
  });
  const wrappers = tree.props.children[0];
  assert.equal(wrappers.length, 2);
  const second = find(wrappers[1], (node) => node.type === ScheduleChip);
  assert.equal(second.props.content, '운동');
  second.props.onPress();
  assert.deepEqual(edited, [2]);
});
