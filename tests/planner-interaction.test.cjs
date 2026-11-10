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
let toasts = [];
let alarmPermissionRequests = 0;
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../src/features/planner/services/note.ts');
const { deleteSelectedNotes } = require('../src/features/planner/services/noteSelection.ts');
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
  useMemo: (factory) => factory(),
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
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  Text: 'Text',
  TextInput: 'TextInput',
  useWindowDimensions: () => dimensions,
});
cacheMock('../src/components/ui/index.tsx', {
  design: require('../src/components/ui/tokens.ts').design,
  showToast: (message) => toasts.push(message),
  showDialog: (title, message, actions) => alerts.push({ title, message, actions }),
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
    red: '#B5485B',
  }),
  report: (error) => {
    throw error;
  },
});
const plannerStore = (selector) => selector({ data: plannerData });
plannerStore.getState = () => ({ data: plannerData });
cacheMock('../src/features/notifications/controllers/notifications.ts', {
  clearScheduleAlarms: async (ids) => {
    plannerActions.setDailyAlarms(
      ids ?? new Set(plannerData.dailyPlanItems.map((item) => item.id)),
      false,
    );
  },
  authorizeScheduleAlarm: async () => {
    alarmPermissionRequests++;
  },
});
const plannerActions = {
  setDailyAlarms: (ids, alarm, time) => {
    plannerData = require('../src/features/planner/services/alarms.ts').updateDailyAlarms(
      plannerData,
      ids,
      alarm,
      time,
    );
  },
  saveDailyNote: (date, text) => saved.push(text),
  setDailyImportant: (ids, important) => {
    plannerData = {
      ...plannerData,
      dailyPlanItems: plannerData.dailyPlanItems.map((item) =>
        ids.has(item.id) ? { ...item, important: important || undefined } : item,
      ),
    };
  },
  saveDailyTimes: (ids, time) => {
    plannerData = {
      ...plannerData,
      dailyPlanItems: plannerData.dailyPlanItems.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              time,
              alarm: require('../src/features/planner/services/alarms.ts').timeChangeClearsAlarm(
                item,
                time,
              )
                ? undefined
                : item.alarm,
            }
          : item,
      ),
    };
  },
  copyDailyNotes: (ids, dates) => {
    plannerData = require('../src/features/planner/services/noteSelection.ts').copyNotesToDates(
      plannerData,
      ids,
      dates,
      () => 'copy-' + nativeEventCount++,
    );
  },
  deleteDailyNotes: (ids) => {
    plannerData = deleteSelectedNotes(plannerData, ids);
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
    alarmSetting: false,
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
function renderInput(note = '회의,장보기', initialIndex, onSelect = () => {}, options = {}) {
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
    ...options,
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
  alarmPermissionRequests = 0;
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
    alarmSetting: false,
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
  assert.ok(editor.input.props.style.width >= 48 + 16);
  assert.ok(editor.input.props.style.width < dimensions.width - 68);
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
function renderSelection() {
  cursor = 0;
  // React 훅: 상태 유지 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useNoteSelection(() => {});
}
function buttonTitles(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(buttonTitles);
  if (node.type === 'Button' || node.type?.name === 'SheetAction') return [node.props.title];
  return buttonTitles(node.props?.children);
}

test('single and multiple selections offer the same actions', () => {
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
  assert.deepEqual(buttonTitles(bar), ['시간 설정', '일정 복사', '알람 설정', '삭제', '더보기']);
  selection.toggle('2026-11-07', 1);
  selection = renderSelection(edits);
  bar = SelectionBar({ count: 2, onEdit() {}, onCopy() {}, onDelete() {}, onCancel() {} });
  assert.deepEqual(buttonTitles(bar), ['시간 설정', '일정 복사', '알람 설정', '삭제', '더보기']);
  selection.requestDelete();
  assert.equal(plannerData.dailyPlanItems.length, 2);
  selection = renderSelection(edits);
  selection.deleteSelected();
  assert.equal(plannerData.dailyPlanItems.length, 0);
});

test('year and month dialog uses matching steppers and blocks invalid values', () => {
  const choices = [];
  const render = () => {
    cursor = 0;
    return MonthPicker({
      month: '2026-11-07',
      onClose() {},
      onChoose: (date) => choices.push(date),
    });
  };
  const field = (picker, unit) => {
    const node = find(
      picker,
      (node) => node.type?.name === 'NumberField' && node.props.unit === unit,
    );
    return node.type(node.props);
  };
  let picker = render();
  find(field(picker, '년'), (node) => node.type === 'Input').props.onChangeText('2030');
  picker = render();
  find(field(picker, '월'), (node) => node.type === 'Input').props.onChangeText('2');
  picker = render();
  picker.props.footer.props.onPress();
  assert.deepEqual(choices, ['2030-02-01']);
  find(field(picker, '월'), (node) => node.props?.accessibilityLabel === '다음 월').props.onPress();
  picker = render();
  assert.equal(find(field(picker, '월'), (node) => node.type === 'Input').props.value, '3');
  find(field(picker, '월'), (node) => node.type === 'Input').props.onChangeText('13');
  picker = render();
  assert.equal(picker.props.footer.props.disabled, true);
  assert.ok(
    find(
      field(picker, '월'),
      (node) => node.type === 'Label' && node.props.children?.includes?.('1~12'),
    ),
  );
  picker.props.footer.props.onPress();
  assert.equal(choices.length, 1);
  find(field(picker, '년'), (node) => node.type === 'Input').props.onChangeText('0');
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

test('native content-size changes cannot undo measured wrapped lines', () => {
  let editor = renderInput('회의', 0);
  changeInput(editor.input, '회의 내용이 길어서 자동으로 줄이 나뉘는 일정');
  editor = renderInput('회의', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: { lines: [{ width: 40 }, { width: 80 }] },
  });
  editor = renderInput('회의', 0);
  const height = editor.input.props.style.height;
  editor.input.props.onContentSizeChange({ nativeEvent: { contentSize: { height: 22 } } });
  editor = renderInput('회의', 0);
  assert.equal(editor.input.props.value, '회의 내용이 길어서 자동으로 줄이 나뉘는 일정');
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
  cursor = 0;
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

test('selection keeps chip edges mounted and tapping them toggles selection', () => {
  let toggles = 0;
  cursor = 0;
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

test('multi-selection sets, overwrites and clears time on selected chips', () => {
  let id = 0;
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-08',
    '회의,밥먹기,운동',
    () => 'multi-' + ++id,
  );
  let selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection([]);
  selection.openTime();
  selection = renderSelection([]);
  selection.saveTime('13:10');
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:10', '13:10', null],
  );
  selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection([]);
  selection.openTime();
  renderSelection().saveTime('14:20');
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['14:20', '14:20', null],
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  renderSelection().openTime();
  renderSelection().saveTime(null);
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    [null, null, null],
  );
});

test('multiple selected schedules show a disabled copy button with a toast on tap', () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의,운동', () => 'source-' + ++id);
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  let selection = renderSelection();
  const bar = SelectionBar({ count: 2, onCopy: selection.openCopy });
  const copy = find(
    bar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '일정 복사',
  );
  assert.equal(copy.props.disabled, true);
  copy.props.onDisabledPress();
  selection = renderSelection();
  assert.match(toasts.at(-1), /일정 복사는 하나만 가능해요/);
  assert.equal(selection.copySource, undefined);
  assert.equal(selection.active, true);
  assert.equal(plannerData.dailyPlanItems.length, 2);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection();
  const singleBar = SelectionBar({ count: 1, onCopy: selection.openCopy });
  const enabledCopy = find(
    singleBar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '일정 복사',
  );
  assert.equal(enabledCopy.props.disabled, false);
  enabledCopy.props.onPress();
  renderSelection().toggleCopyDate('2026-11-09');
  renderSelection().toggleCopyDate('2026-11-10');
  renderSelection().copySelected();
  assert.equal(plannerData.dailyPlanItems.length, 4);
  assert.deepEqual(
    plannerData.dailyPlanItems
      .filter((item) => item.date !== '2026-11-08')
      .map((item) => item.content),
    ['회의', '회의'],
  );
});

test('marking selected schedules important affects only those chips and supports clearing', () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의,밥먹기,운동', () => 'star-' + ++id);
  let selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection([]);
  selection.toggleImportant();
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => Boolean(item.important)),
    [true, true, false],
  );
  selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection([]);
  assert.equal(selection.allImportant, true);
  selection.toggleImportant();
  assert.equal(
    plannerData.dailyPlanItems.some((item) => item.important),
    false,
  );
});

test('12-hour time picker selects AM/PM for all selected schedules and clamps invalid values', () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  const savedTimes = [];
  const render = () => {
    cursor = 0;
    return TimePicker({
      item: { id: 'a', content: '회의', time: '09:00' },
      count: 2,
      format: '12h',
      onClose() {},
      onSave: (time) => savedTimes.push(time),
    });
  };
  let picker = render();
  find(picker, (node) => node.type === 'Button' && node.props.title === '오후').props.onPress();
  picker = render();
  find(picker, (node) => node.props?.accessibilityLabel === '시').props.onChangeText('13');
  picker = render();
  assert.equal(find(picker, (node) => node.props?.accessibilityLabel === '시').props.value, '12');
  find(picker, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('60');
  picker = render();
  find(
    picker.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(savedTimes, ['12:59']);
  find(picker, (node) => node.type === 'Button' && node.props.title === '오전').props.onPress();
  find(
    render().props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(savedTimes, ['12:59', '00:59']);
});

test('selected chips can overwrite their existing alarm times together', async () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의,식사,운동', () => 'alarm-' + ++id);
  let selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  renderSelection([]).toggleAlarm();
  selection = renderSelection([]);
  assert.equal(selection.alarmSetting, true);
  assert.equal(selection.timeSource.id, 'alarm-1');
  selection.saveTime('13:10');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(alarmPermissionRequests, 1);
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, false],
  );
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:10', '13:10', null],
  );
  selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  selection.toggle('2026-11-08', 1);
  selection = renderSelection([]);
  assert.equal(selection.hasSelectedAlarm, true);
  selection.toggleAlarm();
  assert.equal(renderSelection().alarmSetting, true);
  renderSelection().saveTime('15:30');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['15:30', '15:30', null],
  );
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, false],
  );
  assert.equal(alarmPermissionRequests, 2);
});

test('saved times are editable native input text and cannot remain as undeletable labels', () => {
  const options = { noteTimes: ['13:10', '18:00'] };
  let editor = renderInput('회의,운동', 0, () => {}, options);
  assert.equal(editor.input.props.value, '13:10 회의');
  changeInput(editor.input, '회의');
  editor = renderInput('회의,운동', 0, () => {}, options);
  assert.equal(editor.input.props.value, '회의');
  assert.equal(saved.at(-1), '회의,18:00 운동');
  assert.equal(
    find(editor.tree, (node) => node.type?.name === 'ActiveTimeLabel'),
    undefined,
  );
});

test('copy selection spans month and year boundaries and retains all chosen dates', () => {
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의', () => 'cross-month');
  let selection = renderSelection([]);
  selection.toggle('2026-11-08', 0, true);
  renderSelection([]).openCopy();
  for (const date of ['2026-11-30', '2026-12-01', '2027-01-01']) {
    renderSelection([]).toggleCopyDate(date);
  }
  selection = renderSelection([]);
  assert.deepEqual([...selection.copyDates], ['2026-11-30', '2026-12-01', '2027-01-01']);
  assert.equal(selection.copySource.id, 'cross-month');
  selection.copySelected();
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.date),
    ['2026-11-08', '2026-11-30', '2026-12-01', '2027-01-01'],
  );
});

test('backspacing through a timed chip removes every character without recreating its time label', () => {
  const options = { noteTimes: ['13:10'] };
  let editor = renderInput('회의', 0, () => {}, options);
  const original = editor.input.props.value;
  for (let length = original.length - 1; length >= 0; length--) {
    changeInput(editor.input, original.slice(0, length));
    editor = renderInput('회의', 0, () => {}, options);
    assert.equal(editor.input.props.value, original.slice(0, length));
  }
  assert.equal(saved.at(-1), '');
});

test('selection exits on schedule whitespace while chip taps keep toggling selected items', () => {
  let id = 0;
  const date = '2026-11-08';
  plannerData = applyDailyNote(plannerData, date, '회의,운동', () => 'outside-' + ++id);
  renderSelection([]).toggle(date, 0, true);
  renderSelection([]).toggle(date, 1);
  const selection = renderSelection([]);
  const tree = SchedulePreview({
    note: '회의,운동',
    date,
    selecting: true,
    onEdit: () => assert.fail('selection must not start editing'),
    onSelect: (index) => renderSelection([]).toggle(date, index),
    onOutsidePress: selection.clear,
  });
  find(tree, (node) => node.type === ScheduleChip).props.onPress();
  assert.equal(renderSelection([]).selected.size, 1);
  assert.equal(renderSelection([]).active, true);
  tree.props.onPress();
  assert.equal(renderSelection([]).selected.size, 0);
  assert.equal(renderSelection([]).active, false);
});

test('empty days and date labels dismiss selection without opening input or date information', () => {
  const date = '2026-11-08';
  plannerData = applyDailyNote(plannerData, date, '회의', () => 'empty-outside');
  const select = () => renderSelection([]).toggle(date, 0, true);
  select();
  SchedulePreview({
    note: '',
    date,
    selecting: true,
    onEdit: () => assert.fail('selection must not start editing'),
    onOutsidePress: renderSelection([]).clear,
  }).props.onPress();
  assert.equal(renderSelection([]).active, false);
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
    onOutsidePress: renderSelection([]).clear,
  }).props.onPress();
  assert.equal(renderSelection([]).active, false);
});

test('selection bar omits selection count and bulk selection controls', () => {
  cursor = 0;
  const tree = SelectionBar({ count: 3 });
  assert.deepEqual(buttonTitles(tree), ['시간 설정', '일정 복사', '알람 설정', '삭제', '더보기']);
  assert.equal(
    find(tree, (node) => node.type === 'Label'),
    undefined,
  );
});

test('enter creates the next chip without a newline and keeps the editor available', () => {
  let editor = renderInput('회의', 0);
  changeInput(editor.input, '회의\n');
  editor = renderInput('회의', 0);
  assert.equal(saved.at(-1), '회의,');
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '운동');
  editor = renderInput('회의', 0);
  assert.equal(saved.at(-1), '회의,운동');
  assert.equal(editor.input.props.value, boundary + '운동');
});

test('the first keystroke keeps the empty editor width and font stable', () => {
  let editor = renderInput('', 0);
  const before = editor.input.props.style;
  changeInput(editor.input, 'ㅎ');
  editor = renderInput('', 0);
  assert.equal(editor.input.props.style.width, before.width);
  assert.equal(editor.input.props.style.fontSize, before.fontSize);
  assert.equal(editor.input.props.style.lineHeight, before.lineHeight);
});

test('Korean composition and delayed width measurements do not shrink or resize the editor per syllable', () => {
  let editor = renderInput('회의,장보기,운동', 1);
  flushFrames();
  flushFrames();
  editor = renderInput('회의,장보기,운동', 1);
  const before = editor.input.props.style.width;
  selections = [];
  for (const [text, width] of [
    ['장보ㄱ', 44],
    ['장보기', 45],
    ['장보', 30],
    ['장보기', 43],
  ]) {
    changeInput(editor.input, boundary + text);
    editor = renderInput('회의,장보기,운동', 1);
    find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout(
      {
        nativeEvent: { lines: [{ width }] },
      },
    );
    editor = renderInput('회의,장보기,운동', 1);
    assert.equal(editor.input.props.style.width, before);
    assert.equal(editor.input.props.value, boundary + text);
  }
  flushFrames();
  assert.deepEqual(selections, []);
});

test('ordinary caret movement does not request page measurement or reset the native selection', () => {
  let reveals = 0;
  const options = { onInputLayout: () => reveals++ };
  let editor = renderInput('회의', 0, () => {}, options);
  flushFrames();
  flushFrames();
  editor = renderInput('회의', 0, () => {}, options);
  reveals = 0;
  selections = [];
  changeInput(editor.input, '회의하기');
  editor = renderInput('회의', 0, () => {}, options);
  for (const position of [4, 3, 2, 1]) {
    editor.input.props.onSelectionChange({
      nativeEvent: { selection: { start: position, end: position } },
    });
  }
  flushFrames();
  assert.equal(reveals, 0);
  assert.deepEqual(selections, []);
});

test('copying to a date that already includes the schedule shows a toast and does not select it', () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의', () => 'duplicate-' + ++id);
  plannerData = applyDailyNote(plannerData, '2026-11-09', '회의', () => 'duplicate-' + ++id);
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().openCopy();
  const before = toasts.length;
  const { DayDate } = require('../src/features/planner/components/DayDate.tsx');
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
  assert.equal(toasts.length, before + 2);
  assert.match(toasts.at(-1), /이미 같은 일정/);
});

test('copy rechecks changed targets before saving and preserves the selection on conflict', () => {
  let id = 0;
  plannerData = applyDailyNote(plannerData, '2026-11-08', '회의', () => 'changed-' + ++id);
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().openCopy();
  renderSelection().toggleCopyDate('2026-11-09');
  plannerData = applyDailyNote(plannerData, '2026-11-09', '회의', () => 'changed-' + ++id);
  renderSelection().copySelected();
  assert.equal(plannerData.dailyPlanItems.length, 2);
  assert.match(toasts.at(-1), /이미 같은 일정/);
  assert.equal(renderSelection().copyDates.has('2026-11-09'), true);
  renderSelection().toggleCopyDate('2026-11-09');
  assert.equal(renderSelection().copyDates.size, 0);
});

test('time modal applies mixed selected times without an overwrite notice', () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  let id = 0;
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-08',
    '13:00 회의,14:00 운동,독서',
    () => 'overwrite-' + ++id,
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  renderSelection().openTime();
  const selection = renderSelection();
  const bar = SelectionBar({ count: 2, onTime: selection.openTime });
  const timeButton = find(
    bar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '시간 설정',
  );
  assert.notEqual(timeButton.props.disabled, true);
  slots = [];
  cursor = 0;
  const dialog = TimePicker({
    item: selection.timeSource,
    format: '24h',
    count: 2,
    hasExistingTime: true,
    onClose: selection.closeTime,
    onSave: selection.saveTime,
  });
  assert.equal(
    find(dialog.props.footer, (node) => node.type === 'Button' && node.props.title === '적용').props
      .title,
    '적용',
  );
  assert.equal(plannerData.dailyPlanItems[1].time, '14:00');
  find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:00', '13:00', null],
  );
});

test('alarm modal applies and aligns all selected schedule times without an overwrite notice', async () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  let id = 0;
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-08',
    '13:00 회의,14:00 운동,독서,18:00 식사',
    () => 'alarm-overwrite-' + ++id,
  );
  plannerData = {
    ...plannerData,
    dailyPlanItems: plannerData.dailyPlanItems.map((item, index) =>
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
  slots = [];
  cursor = 0;
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
  assert.equal(plannerData.dailyPlanItems[1].time, '14:00');
  assert.equal(alarmPermissionRequests, 0);
  find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:00', '13:00', '13:00', '18:00'],
  );
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [true, true, true, false],
  );
});

test('time and alarm clear actions share footer styling and alarm clearing preserves schedule time', async () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  let nextId = 0;
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-08',
    '13:00 회의,14:00 식사',
    () => 'clear-' + nextId++,
  );
  plannerData = {
    ...plannerData,
    dailyPlanItems: plannerData.dailyPlanItems.map((item, index) => ({
      ...item,
      id: 'clear-' + index,
      alarm: true,
    })),
  };
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggleAlarm();
  const selection = renderSelection();
  slots = [];
  cursor = 0;
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
  assert.equal(plannerData.dailyPlanItems[0].alarm, undefined);
  assert.equal(plannerData.dailyPlanItems[0].time, '13:00');
  assert.equal(plannerData.dailyPlanItems[1].alarm, true);
  assert.equal(alarmPermissionRequests, 0);
});

test('settings asks for confirmation before deleting every alarm', async () => {
  const { useAlarmSettings } = require('../src/features/settings/hooks/useAlarmSettings.ts');
  let id = 0;
  plannerData = applyDailyNote(
    plannerData,
    '2026-11-08',
    '13:00 회의,14:00 식사',
    () => 'settings-' + id++,
  );
  plannerData = {
    ...plannerData,
    dailyPlanItems: plannerData.dailyPlanItems.map((item) => ({ ...item, alarm: true })),
  };
  cursor = 0;
  const settings = useAlarmSettings();
  settings.requestDelete();
  assert.equal(
    plannerData.dailyPlanItems.every((item) => item.alarm),
    true,
  );
  const dialog = alerts.at(-1);
  assert.equal(dialog.title, '모든 알람 삭제');
  assert.equal(dialog.actions[0].style, 'cancel');
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    plannerData.dailyPlanItems.some((item) => item.alarm),
    false,
  );
  assert.deepEqual(
    plannerData.dailyPlanItems.map((item) => item.time),
    ['13:00', '14:00'],
  );
  assert.equal(toasts.at(-1), '모든 알람을 삭제했어요.');
});

test('time clearing appears in the footer with the same typography as apply', () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  const saved = [];
  cursor = 0;
  const dialog = TimePicker({
    item: { id: 'a', content: '회의', time: '13:00' },
    format: '24h',
    onClose() {},
    onSave: (time) => saved.push(time),
  });
  const remove = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '시간 지우기',
  );
  const apply = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  );
  assert.equal(remove.props.bold, apply.props.bold);
  assert.equal(remove.props.style, apply.props.style);
  assert.equal(
    find(dialog, (node) => node.type === 'Button' && node.props.title === '시간 지우기'),
    undefined,
  );
  remove.props.onPress();
  assert.deepEqual(saved, [null]);
});

test('time and alarm dialogs keep controls fixed and scroll only the schedule preview', () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  const items = Array.from({ length: 8 }, (_, index) => ({
    id: 'layout-' + index,
    content: '일정 ' + index,
    time: '13:00',
  }));
  for (const format of ['12h', '24h']) {
    const dialogs = ['시간 설정', '알람 설정'].map((title) => {
      slots = [];
      cursor = 0;
      return TimePicker({
        title,
        item: items[0],
        items,
        count: items.length,
        format,
        onClose() {},
        onSave() {},
      });
    });
    for (const dialog of dialogs) {
      assert.equal(dialog.props.scrollable, false);
      assert.equal(dialog.props.height, undefined);
      const [preview, controls] = React.Children.toArray(dialog.props.children);
      assert.deepEqual(
        preview.props.style,
        React.Children.toArray(dialogs[0].props.children)[0].props.style,
      );
      const list = find(preview, (node) => node.type === 'ScrollView');
      assert.ok(list);
      assert.ok(list.props.style.maxHeight > 0);
      assert.equal(list.props.style.height, undefined);
      assert.equal(
        find(list, (node) => node.props?.accessibilityLabel === '시'),
        undefined,
      );
      assert.ok(find(controls, (node) => node.props?.accessibilityLabel === '시'));
      assert.ok(find(controls, (node) => node.props?.accessibilityLabel === '분'));
      assert.ok(
        find(
          list,
          (node) => node.type === 'Label' && String(node.props.children).includes('13시 일정 7'),
        ) ||
          find(
            list,
            (node) =>
              node.type === 'Label' && String(node.props.children).includes('오후 1시 일정 7'),
          ),
      );
      assert.equal(
        find(controls, (node) => node.type === 'ScrollView'),
        undefined,
      );
    }
  }
});

test('time modal warns below the title only when the chosen time would clear an existing alarm', () => {
  const { TimePicker } = require('../src/features/planner/components/TimePicker.tsx');
  const { light } = require('../src/components/ui/palette.ts');
  const items = [
    { id: 'a', content: '회의', time: '13:00', alarm: true },
    { id: 'b', content: '식사', time: '14:00' },
  ];
  const render = (alarmSetting = false) => {
    cursor = 0;
    return TimePicker({
      item: items[0],
      items,
      count: 2,
      format: '24h',
      alarmSetting,
      onClose() {},
      onSave() {},
    });
  };
  let dialog = render();
  assert.equal(dialog.props.headerNotice, null);
  find(dialog, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('30');
  dialog = render();
  const notice = dialog.props.headerNotice;
  assert.equal(notice.props.children, '알람이 설정된 일정은 알람이 해제돼요');
  assert.equal(notice.props.style.color, light.red);
  assert.equal(notice.props.style.fontSize, 13);
  assert.equal(dialog.props.scrollable, false);
  const alarmNotice = render(true).props.headerNotice;
  assert.equal(alarmNotice.props.children, '설정한 시간으로 알람이 일괄로 설정돼요');
  assert.deepEqual(alarmNotice.props.style, notice.props.style);
  find(dialog, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('00');
  assert.equal(render().props.headerNotice, null);
});

test('more opens a modal for important schedules and applies the action', () => {
  slots = [];
  cursor = 0;
  let marked = 0;
  const props = { count: 1, onImportant: () => marked++ };
  let tree = SelectionBar(props);
  assert.equal(
    find(tree, (node) => node.type === 'Dialog'),
    undefined,
  );
  find(tree, (node) => node.props?.title === '더보기').props.onPress();
  cursor = 0;
  tree = SelectionBar(props);
  const dialog = find(tree, (node) => node.type === 'Dialog');
  assert.ok(dialog);
  find(dialog, (node) => node.props?.title === '중요 일정 등록').props.onPress();
  assert.equal(marked, 1);
  cursor = 0;
  assert.equal(
    find(SelectionBar(props), (node) => node.type === 'Dialog'),
    undefined,
  );
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
