require('./register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const React = require('react');
let slots;
let cursor;
let saved;
let focused;
let preferences;
let layoutEffects;
let selections;
let alerts;
let nativeEventCount;
let plannerData;
let dimensions;
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../src/features/planner/services/note.ts');
const {
  deleteSelectedNotes,
  copyNoteToDates,
} = require('../src/features/planner/services/noteSelection.ts');
function changeInput(input, text, eventCount = ++nativeEventCount) {
  input.props.onChange({ nativeEvent: { text, eventCount } });
}
const frames = new Map();
let frameId = 0;
global.requestAnimationFrame = (callback) => {
  frames.set(++frameId, callback);
  return frameId;
};
global.cancelAnimationFrame = (id) => frames.delete(id);
function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback());
}
const nativeInput = {
  focus: () => focused++,
  setSelection: (start, end) => selections.push({ start, end }),
};
function cacheMock(id, exports) {
  const filename = require.resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
cacheMock('react', {
  ...React,
  useCallback: (callback) => callback,
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [
      slots[index],
      (value) => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      },
    ];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useLayoutEffect(effect, deps) {
    const index = cursor++;
    const previous = slots[index];
    const changed = !previous || deps.some((value, position) => value !== previous.deps[position]);
    if (changed) {
      previous?.cleanup?.();
      const slot = { deps };
      slots[index] = slot;
      layoutEffects.push(() => {
        slot.cleanup = effect();
      });
    }
  },
  useEffect(effect) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { cleanup: effect() };
  },
});
cacheMock('react-native', {
  Alert: { alert: (title, message, buttons) => alerts.push({ title, message, buttons }) },
  Keyboard: { dismiss() {} },
  View: 'View',
  Pressable: 'Pressable',
  Text: 'Text',
  TextInput: 'TextInput',
  useWindowDimensions: () => dimensions,
});
cacheMock('../src/components/ui/index.tsx', {
  design: require('../src/components/ui/tokens.ts').design,
  Button: 'Button',
  Label: 'Label',
  Input: 'Input',
  useTheme: () => ({
    text: '#20344A',
    muted: '#566E87',
    line: '#DBE8F3',
    accent: '#1F6EAC',
    bg: '#F7FBFF',
    selected: '#E4F2FF',
  }),
  report: (error) => {
    throw error;
  },
});
const plannerStore = (selector) => selector({ data: plannerData });
plannerStore.getState = () => ({ data: plannerData });
const plannerActions = {
  saveDailyNote: (date, text) => saved.push(text),
  saveDailyTime: (id, time) => {
    plannerData = {
      ...plannerData,
      dailyPlanItems: plannerData.dailyPlanItems.map((item) =>
        item.id === id ? { ...item, time } : item,
      ),
    };
  },
  deleteDailyNotes: (ids) => {
    plannerData = deleteSelectedNotes(plannerData, ids);
  },
  copyDailyNote: (id, dates) => {
    plannerData = copyNoteToDates(plannerData, id, dates, () => 'copy-' + nativeEventCount++);
  },
};
cacheMock('../src/stores/planner.ts', { usePlanner: plannerStore });
let selectionState;
const selectionStore = (selector) => selector(selectionState);
selectionStore.getState = () => selectionState;
selectionStore.setState = (patch) => {
  selectionState = { ...selectionState, ...patch };
};
cacheMock('../src/stores/noteSelection.ts', {
  useNoteSelectionStore: selectionStore,
  emptySelection: () => ({
    active: false,
    selected: new Set(),
    deleteIds: null,
    timeId: null,
    copyId: null,
    copyDates: new Set(),
  }),
});

cacheMock('../src/features/planner/hooks/usePlannerActions.ts', {
  usePlannerActions: () => plannerActions,
});
cacheMock('@expo/vector-icons/Feather', () => null);
cacheMock('../src/components/ui/Dialog.tsx', { Dialog: 'Dialog' });
cacheMock('expo-sqlite/kv-store', {
  getItem: async (key) => preferences[key] ?? null,
  setItem: async (key, value) => {
    preferences[key] = value;
  },
});
const {
  ScheduleInput,
  SchedulePreview,
  ScheduleChip,
} = require('../src/features/planner/components/ScheduleInput.tsx');
const { usePlannerGuide } = require('../src/features/planner/hooks/usePlannerGuide.ts');
const { NOTE_INPUT_BOUNDARY: boundary } = require('../src/features/planner/services/note.ts');
function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}
function renderInput(note = '회의,장보기', initialIndex, onSelect = () => {}) {
  cursor = 0;
  const tree = ScheduleInput({
    date: '2026-11-07',
    note,
    initialIndex,
    onSelect,
    onBlur() {},
    onEditPart() {},
    onInputFocus() {},
    onInputLayout() {},
  });
  const input = find(tree, (node) => node.type === 'TextInput');
  input.props.ref.current = nativeInput;
  layoutEffects.splice(0).forEach((effect) => effect());
  return { tree, input };
}
function renderGuide() {
  cursor = 0;
  // React 훅: 상태 유지 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePlannerGuide();
}
beforeEach(() => {
  slots = [];
  cursor = 0;
  saved = [];
  focused = 0;
  preferences = {};
  layoutEffects = [];
  selections = [];
  alerts = [];
  nativeEventCount = 0;
  plannerData = emptyData();
  selectionState = {
    active: false,
    selected: new Set(),
    deleteIds: null,
    timeId: null,
    copyId: null,
    copyDates: new Set(),
  };
  dimensions = { height: 800, width: 360, fontScale: 1 };
  frames.clear();
});

test('backspace first opens the last chip for editing without deleting its text', () => {
  let { input } = renderInput();
  assert.equal(input.props.value, boundary);
  changeInput(input, '');
  ({ input } = renderInput());
  assert.equal(input.props.value, boundary + '장보기');
  assert.equal(saved.at(-1), '회의,장보기');
  changeInput(input, ''); // 이전 빈 입력의 지연 삭제 이벤트.
  ({ input } = renderInput());
  assert.equal(input.props.value, boundary + '장보기');
  assert.equal(saved.at(-1), '회의,장보기');
  flushFrames();
  input.props.onSelectionChange({ nativeEvent: { selection: { start: 4, end: 4 } } });
  ({ input } = renderInput());
  changeInput(input, boundary + '장보');
  assert.equal(saved.at(-1), '회의,장보');
});

test('split followed by backspace keeps one copy of the chip and hides the comma', () => {
  let { input } = renderInput('회의', 0);
  changeInput(input, '회의,');
  ({ input } = renderInput('회의', 0));
  assert.equal(input.props.value, boundary);
  changeInput(input, '');
  ({ input } = renderInput('회의', 0));
  assert.equal(input.props.value, '회의');
  assert.equal(saved.at(-1), '회의');
  changeInput(input, '');
  assert.equal(saved.at(-1), '회의');
});

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
  assert.equal(focused, 1);
});

test('closing without opting out shows the guide on the next launch', async () => {
  renderGuide();
  await Promise.resolve();
  let guide = renderGuide();
  assert.equal(guide.guideOpen, true);
  guide.closeGuide();
  assert.equal(preferences['planner.guide.v1.hidden'], '0');
  slots = [];
  renderGuide();
  await Promise.resolve();
  guide = renderGuide();
  assert.equal(guide.guideOpen, true);
});

test('opting out hides the launch guide and the header can still reopen it', async () => {
  renderGuide();
  await Promise.resolve();
  let guide = renderGuide();
  guide.setDontShowAgain(true);
  guide = renderGuide();
  guide.closeGuide();
  slots = [];
  renderGuide();
  await Promise.resolve();
  guide = renderGuide();
  assert.equal(guide.guideOpen, false);
  guide.openGuide();
  guide = renderGuide();
  assert.equal(guide.guideOpen, true);
  guide.setDontShowAgain(false);
  guide = renderGuide();
  guide.closeGuide();
  assert.equal(preferences['planner.guide.v1.hidden'], '0');
});

test('chip focus and caret wait for committed text and ignore old selection events', () => {
  let editor = renderInput('회의,장보기,운동');
  flushFrames();
  selections = [];
  const first = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '회의',
  );
  first.props.onPress();
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.value, '회의');
  assert.deepEqual(editor.input.props.selection, { start: 2, end: 2 });
  // 이전 native 선택 이벤트: 새 커서 요청 유지.
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 2, end: 2 } } });
  editor = renderInput('회의,장보기,운동');
  assert.deepEqual(editor.input.props.selection, { start: 2, end: 2 });
  const second = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  second.props.onPress();
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.value, boundary + '장보기');
  assert.deepEqual(selections, []);
  flushFrames();
  assert.deepEqual(selections, [{ start: 4, end: 4 }]);
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 4, end: 4 } } });
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.selection, undefined);
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 2, end: 2 } } });
  editor = renderInput('회의,장보기,운동');
  flushFrames();
  assert.equal(editor.input.props.selection, undefined);
  assert.deepEqual(selections, [{ start: 4, end: 4 }]);
  assert.deepEqual(saved, []);
});

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

test('editing a chip uses its measured text width and leaves room for following chips', () => {
  let editor = renderInput('회의,장보기,운동', 1);
  assert.equal(editor.input.props.style.flexGrow, 0);
  const measurement = find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout);
  measurement.props.onTextLayout({ nativeEvent: { lines: [{ width: 48 }] } });
  editor = renderInput('회의,장보기,운동', 1);
  assert.equal(editor.input.props.style.width, 66);
  assert.ok(
    find(
      editor.tree,
      (node) => node.type?.name === 'ScheduleChip' && node.props.content === '운동',
    ),
  );
  editor.tree.props.onLayout({ nativeEvent: { layout: { width: 160 } } });
  changeInput(editor.input, boundary + '아주 긴 일정 내용입니다');
  editor = renderInput('회의,장보기,운동', 1);
  assert.ok(editor.input.props.style.width <= 150);
  assert.equal(editor.input.props.style.flexGrow, 0);
});

test('chip edges insert exactly before or after the tapped chip without saving an empty schedule', () => {
  let editor = renderInput('회의,장보기', 0);
  const chip = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  chip.props.onBefore();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '중간');
  assert.equal(saved.at(-1), '회의,중간,장보기');
  const after = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  after.props.onAfter();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '마지막');
  assert.equal(saved.at(-1), '회의,중간,장보기,마지막');
});

const { useNoteSelection } = require('../src/features/planner/hooks/useNoteSelection.ts');
const { SelectionBar } = require('../src/features/planner/components/SelectionBar.tsx');
const { MonthPicker } = require('../src/features/planner/components/MonthPicker.tsx');
function renderSelection(edits) {
  cursor = 0;
  // React 훅: 상태 유지 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useNoteSelection(
    () => {},
    (...args) => edits.push(args),
  );
}
function buttonTitles(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(buttonTitles);
  if (node.type === 'Button') return [node.props.title];
  return buttonTitles(node.props?.children);
}

test('one selected schedule offers edit, copy and delete; several offer only delete', () => {
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-07',
    '회의,장보기',
    () => 'item-' + nativeEventCount++,
  );
  const edits = [];
  let selection = renderSelection(edits);
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection(edits);
  assert.equal(selection.selected.size, 1);
  let bar = SelectionBar({ count: 1, onEdit() {}, onCopy() {}, onDelete() {}, onCancel() {} });
  assert.deepEqual(buttonTitles(bar), [
    '선택 해제',
    '수정하기',
    '시간 설정',
    '일정 복사',
    '삭제하기',
  ]);
  selection.toggle('2026-11-07', 1);
  selection = renderSelection(edits);
  bar = SelectionBar({ count: 2, onEdit() {}, onCopy() {}, onDelete() {}, onCancel() {} });
  assert.deepEqual(buttonTitles(bar), ['선택 해제', '삭제하기']);
  selection.requestDelete();
  assert.equal(plannerData.dailyPlanItems.length, 2);
  selection = renderSelection(edits);
  selection.deleteSelected();
  assert.equal(plannerData.dailyPlanItems.length, 0);
});

test('a selected schedule opens editing at its own date and index', () => {
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-07',
    '회의,장보기',
    () => 'item-' + nativeEventCount++,
  );
  const edits = [];
  let selection = renderSelection(edits);
  selection.toggle('2026-11-07', 1, true);
  selection = renderSelection(edits);
  selection.editSelected();
  assert.deepEqual(edits, [['2026-11-07', 1]]);
  assert.equal(renderSelection(edits).active, false);
});

test('year and month dialog chooses the exact month and disables invalid years', () => {
  const choices = [];
  const render = () => {
    cursor = 0;
    return MonthPicker({
      month: '2026-11-07',
      onClose() {},
      onChoose: (date) => choices.push(date),
    });
  };
  let picker = render();
  find(picker, (node) => node.type === 'Input').props.onChangeText('2030');
  picker = render();
  find(picker, (node) => node.type === 'Button' && node.props.title === '2월').props.onPress();
  picker = render();
  picker.props.footer.props.onPress();
  assert.deepEqual(choices, ['2030-02-01']);
  find(picker, (node) => node.type === 'Input').props.onChangeText('0');
  assert.equal(render().props.footer.props.disabled, true);
});

test('copy mode selects dates on the current page and retains dates across navigation', () => {
  plannerData = applyDailyNote(plannerData, '2026-11-07', '회의', () => 'source');
  plannerData = applyDailyNote(plannerData, '2026-11-08', '기존 일정', () => 'existing');
  const edits = [];
  let selection = renderSelection(edits);
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection(edits);
  selection.openCopy();
  selection = renderSelection(edits);
  assert.equal(selection.active, false);
  assert.equal(selection.copySource.content, '회의');
  selection.toggleCopyDate('2026-11-07');
  selection.toggleCopyDate('2026-11-08');
  selection = renderSelection(edits);
  assert.deepEqual([...selection.copyDates], ['2026-11-08']);
  // 표시 월 변경 시 선택 날짜 유지.
  selection.toggleCopyDate('2026-12-01');
  selection = renderSelection(edits);
  assert.deepEqual([...selection.copyDates], ['2026-11-08', '2026-12-01']);
  selection.copySelected();
  assert.deepEqual(
    plannerData.dailyPlanItems
      .filter((item) => item.date === '2026-11-08')
      .map((item) => item.content),
    ['기존 일정', '회의'],
  );
  assert.equal(plannerData.dailyPlanItems.filter((item) => item.date === '2026-12-01').length, 1);
  assert.equal(renderSelection(edits).copySource, undefined);
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
  assert.deepEqual(saved, []);
});

test('typing after a wide word never first shrinks the editor to an estimated narrower width', () => {
  let editor = renderInput('WWWW', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: { lines: [{ width: 56 }] },
  });
  editor = renderInput('WWWW', 0);
  const before = editor.input.props.style.width;
  changeInput(editor.input, 'WWWWW');
  editor = renderInput('WWWW', 0);
  assert.ok(editor.input.props.style.width >= before);
});

test('normal Korean composition can replace existing syllables immediately after selecting a chip', () => {
  let editor = renderInput('첫번째,회의', 0);
  find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '회의',
  ).props.onPress();
  editor = renderInput('첫번째,회의', 0);
  changeInput(editor.input, boundary + '회이');
  assert.equal(saved.at(-1), '첫번째,회이');
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

cacheMock('../src/features/planner/components/DraggableSchedulePreview.tsx', {
  DraggableSchedulePreview: function DraggableSchedulePreview() {},
});
cacheMock('../src/features/planner/components/RecurringNote.tsx', {
  RecurringNote: 'RecurringNote',
});
const { DayRow } = require('../src/features/planner/components/DayRow.tsx');
const { DayDate } = require('../src/features/planner/components/DayDate.tsx');
test('copy mode picks a visible day row and makes existing schedules read only', () => {
  const picked = [];
  const edits = [];
  cursor = 0;
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

test('marked dates open date information and copy mode keeps date selection priority', () => {
  const calls = [];
  const props = {
    date: '2026-01-01',
    holidayName: '신정',
    isToday: false,
    copying: false,
    copyTarget: false,
    copySource: false,
    onCopyDate: (date) => calls.push(date),
    onFinish() {},
    onInfo: () => calls.push('info'),
  };
  const badge = DayDate(props);
  assert.match(badge.props.accessibilityLabel, /신정/);
  badge.props.onPress();
  assert.deepEqual(calls, ['info']);
  const dot = find(badge, (node) => node.type?.name === 'DateDot');
  assert.equal(dot.props.visible, true);
  calls.length = 0;
  DayDate({ ...props, copying: true }).props.onPress();
  assert.deepEqual(calls, ['2026-01-01']);
  calls.length = 0;
  DayDate({ ...props, holidayName: null }).props.onPress();
  assert.deepEqual(calls, []);
});

test('single selection sets time independently of schedule content', () => {
  plannerData = applyDailyNote(plannerData, '2026-11-07', '밥먹기', () => 'meal');
  const edits = [];
  let selection = renderSelection(edits);
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection(edits);
  selection.openTime();
  selection = renderSelection(edits);
  assert.equal(selection.timeSource.content, '밥먹기');
  selection.saveTime('13:00');
  assert.equal(plannerData.dailyPlanItems[0].time, '13:00');
  assert.equal(plannerData.dailyPlanItems[0].content, '밥먹기');
});

test('editor stays within available phone and tablet widths at larger font scales', () => {
  for (const width of [320, 360, 768, 1024, 1366]) {
    for (const fontScale of [1, 1.4, 2]) {
      slots = [];
      dimensions = { width, height: 800, fontScale };
      const available = Math.min(width, 960) - 88;
      let editor = renderInput('아주 긴 일정 내용입니다 '.repeat(30), 0);
      editor.tree.props.onLayout({ nativeEvent: { layout: { width: available } } });
      editor = renderInput('아주 긴 일정 내용입니다 '.repeat(30), 0);
      assert.ok(editor.input.props.style.width <= available);
      assert.ok(editor.input.props.style.width >= 30);
      assert.ok(editor.input.props.style.height <= 240);
    }
  }
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
    cursor = 0;
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

test('programmatic boundary caret releases even if native selection acknowledgment is missing', () => {
  let editor = renderInput('회의,장보기', 0);
  const chip = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  chip.props.onBefore();
  editor = renderInput('회의,장보기', 0);
  flushFrames();
  flushFrames();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.selection, undefined);
  assert.deepEqual(saved, []);
});

test('native content-size changes cannot undo measured explicit line breaks', () => {
  let editor = renderInput('회의', 0);
  changeInput(editor.input, '회의\n두 번째 줄');
  editor = renderInput('회의', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: { lines: [{ width: 40 }, { width: 80 }] },
  });
  editor = renderInput('회의', 0);
  const height = editor.input.props.style.height;
  editor.input.props.onContentSizeChange({ nativeEvent: { contentSize: { height: 22 } } });
  editor = renderInput('회의', 0);
  assert.equal(editor.input.props.value, '회의\n두 번째 줄');
  assert.equal(editor.input.props.style.height, height);
  assert.ok(height >= 52);
});

test('canceling delete confirmation retains both schedules and selection', () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-07', '회의,운동', () => String(++id));
  const edits = [];
  let selection = renderSelection(edits);
  selection.toggle('2026-11-07', 0, true);
  selection = renderSelection(edits);
  selection.requestDelete();
  selection = renderSelection(edits);
  assert.equal(selection.deleteCount, 1);
  selection.cancelDelete();
  selection = renderSelection(edits);
  selection.deleteSelected();
  assert.equal(plannerData.dailyPlanItems.length, 2);
  assert.equal(selection.selected.size, 1);
});

test('large font line measurements keep enough height for every explicit line', () => {
  dimensions.fontScale = 2;
  let editor = renderInput('회의\n운동', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: {
      lines: [
        { width: 60, height: 44 },
        { width: 60, height: 44 },
      ],
    },
  });
  editor = renderInput('회의\n운동', 0);
  assert.equal(editor.input.props.style.height, 96);
});
