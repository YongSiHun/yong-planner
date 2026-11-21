const { find } = require('./tree.cjs');
const { createModuleMock } = require('./mock-module.cjs');
require('./register.cjs');
const state = {};
const noop = () => {};

function createSelection() {
  return {
    active: false,
    selected: new Set(),
    deleteIds: null,
    timeId: null,
    alarmSetting: false,
    copyId: null,
    copyDates: new Set(),
  };
}

const { beforeEach } = require('node:test');
const { createHookHarness } = require('./hooks.cjs');
const { createAnimationFrames } = require('./frames.cjs');
const hooks = createHookHarness();
const React = hooks.react;
const frames = createAnimationFrames();
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
const { deleteSelectedNotes } = require('../../src/features/planner/services/noteSelection.ts');

function changeInput(input, text, eventCount = ++state.nativeEventCount) {
  state.nativeText = text;
  input.props.onChange({ nativeEvent: { text, eventCount } });
}

global.requestAnimationFrame = frames.request;
global.cancelAnimationFrame = frames.cancel;
const flushFrames = frames.flush;

const nativeInput = {
  focus: () => state.focused++,
  setSelection: (start, end) => state.selections.push({ start, end }),
};

const cacheMock = createModuleMock(require);

cacheMock('react', React);

cacheMock('react-native', {
  StyleSheet: { create: (styles) => styles },
  Alert: { alert: (title, message, buttons) => state.alerts.push({ title, message, buttons }) },
  Keyboard: { dismiss() {} },
  View: 'View',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  Text: 'Text',
  TextInput: 'TextInput',
  useWindowDimensions: () => state.dimensions,
});

cacheMock('../../src/components/ui/index.tsx', {
  design: require('../../src/components/ui/tokens.ts').design,
  showDeleteDialog: (message, onConfirm) =>
    state.alerts.push(
      require('../../src/services/confirmation.ts').deleteConfirmation(message, onConfirm),
    ),
  showToast: (message) => state.toasts.push(message),
  showDialog: (title, message, actions) => state.alerts.push({ title, message, actions }),
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

const plannerStore = (selector) => selector({ data: state.plannerData });

plannerStore.getState = () => ({ data: state.plannerData });

cacheMock('../../src/features/notifications/controllers/notifications.ts', {
  clearScheduleAlarms: async (ids) => {
    plannerActions.setDailyAlarms(
      ids ?? new Set(state.plannerData.dailyPlanItems.map((item) => item.id)),
      false,
    );
  },
  authorizeScheduleAlarm: async () => {
    state.alarmPermissionRequests++;
    if (state.alarmPermissionError) throw state.alarmPermissionError;
  },
});

const plannerActions = {
  setDailyAlarms: (ids, alarm, time) => {
    state.plannerData = require('../../src/features/planner/services/alarms.ts').updateDailyAlarms(
      state.plannerData,
      ids,
      alarm,
      time,
    );
  },
  saveDailyNote: (date, text) => state.saved.push(text),
  stageDailyNote: (date, text) => state.saved.push(typeof text === 'function' ? text() : text),
  commitPlannerChanges() {},
  flush: async () => {
    state.flushes = (state.flushes ?? 0) + 1;
  },
  finishDailyNote: (date) => {
    state.plannerData =
      require('../../src/features/planner/services/noteItems.ts').finalizeDailyNote(
        state.plannerData,
        date,
      );
  },
  setDailyImportant: (ids, important) => {
    state.plannerData = {
      ...state.plannerData,
      dailyPlanItems: state.plannerData.dailyPlanItems.map((item) =>
        ids.has(item.id) ? { ...item, important: important || undefined } : item,
      ),
    };
  },
  saveDailyTimes: (ids, time) => {
    state.plannerData = {
      ...state.plannerData,
      dailyPlanItems: state.plannerData.dailyPlanItems.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              time,
              alarm: require('../../src/features/planner/services/alarms.ts').timeChangeClearsAlarm(
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
    state.plannerData =
      require('../../src/features/planner/services/noteSelection.ts').copyNotesToDates(
        state.plannerData,
        ids,
        dates,
        () => 'copy-' + state.nativeEventCount++,
      );
  },
  deleteDailyNotes: (ids) => {
    state.plannerData = deleteSelectedNotes(state.plannerData, ids);
  },
};

cacheMock('../../src/stores/planner.ts', { usePlanner: plannerStore });

const selectionStore = (selector) => selector(state.selectionState);

selectionStore.getState = () => state.selectionState;

selectionStore.setState = (patch) => {
  state.selectionState = { ...state.selectionState, ...patch };
};

cacheMock('../../src/stores/noteSelection.ts', {
  useNoteSelectionStore: selectionStore,
  emptySelection: createSelection,
});

cacheMock('../../src/features/planner/hooks/usePlannerActions.ts', {
  usePlannerActions: () => plannerActions,
});

cacheMock('@expo/vector-icons/Feather', () => null);

cacheMock('../../src/components/ui/Dialog.tsx', { Dialog: 'Dialog' });

cacheMock('expo-sqlite/kv-store', {
  getItem: async (key) => state.preferences[key] ?? null,
  setItem: async (key, value) => {
    state.preferences[key] = value;
  },
});

const { ScheduleInput } = require('../../src/features/planner/components/ScheduleInput.tsx');
const { SchedulePreview } = require('../../src/features/planner/components/SchedulePreview.tsx');
const { ScheduleChip } = require('../../src/features/planner/components/ScheduleChip.tsx');

const { usePlannerGuide } = require('../../src/features/planner/hooks/usePlannerGuide.ts');

function renderInput(note = '회의,장보기', initialIndex, onSelect = noop, options = {}) {
  hooks.beginRender();
  const element = ScheduleInput({
    date: '2026-11-07',
    note,
    initialIndex,
    onBlur: noop,
    onInputFocus: noop,
    onInputLayout: noop,
    ...options,
  });
  const tree = renderInputChildren(element);
  const input = find(tree, (node) => node.type === 'TextInput');
  input.props.ref.current = nativeInput;
  if (state.nativeText === undefined) state.nativeText = input.props.defaultValue ?? '';
  if (input.props.value !== undefined) {
    state.nativeWrites.push(input.props.value);
    state.nativeText = input.props.value;
  }
  hooks.flushLayoutEffects();
  hooks.flushEffects();
  return { tree, input };
}

function renderGuide() {
  hooks.beginRender();
  // React 훅: 상태 유지 mock 실행.

  return hooks.render(usePlannerGuide);
}

beforeEach(() => {
  hooks.reset();
  state.toasts = [];
  state.alarmPermissionRequests = 0;
  state.alarmPermissionError = null;
  hooks.beginRender();
  state.nativeText = undefined;
  state.nativeWrites = [];
  state.saved = [];
  state.flushes = 0;
  state.focused = 0;
  state.preferences = {};
  state.selections = [];
  state.alerts = [];
  state.nativeEventCount = 0;
  state.plannerData = emptyData();
  state.selectionState = createSelection();
  state.dimensions = { height: 800, width: 360, fontScale: 1 };
  frames.reset();
});

const { useNoteSelection } = require('../../src/features/planner/hooks/useNoteSelection.ts');
const { SelectionBar } = require('../../src/features/planner/components/SelectionBar.tsx');
const { MonthPicker } = require('../../src/features/planner/components/MonthPicker.tsx');

function renderSelection() {
  hooks.beginRender();
  // React 훅: 상태 유지 mock 실행.

  return hooks.render(() => useNoteSelection(() => {}));
}

function buttonTitles(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(buttonTitles);
  if (node.type === 'Button' || node.type?.name === 'SheetAction') return [node.props.title];
  return buttonTitles(node.props?.children);
}

cacheMock('../../src/features/planner/components/DraggableSchedulePreview.tsx', {
  DraggableSchedulePreview: function DraggableSchedulePreview() {},
});

cacheMock('../../src/features/planner/components/RecurringNote.tsx', {
  RecurringNote: 'RecurringNote',
});

const { DayRow } = require('../../src/features/planner/components/DayRow.tsx');
const { DayDate } = require('../../src/features/planner/components/DayDate.tsx');

module.exports = {
  hooks,
  DayDate,
  DayRow,
  MonthPicker,
  React,
  ScheduleChip,
  SchedulePreview,
  SelectionBar,
  applyDailyNote,
  buttonTitles,
  changeInput,
  find,
  flushFrames,
  renderGuide,
  renderInput,
  renderSelection,
  state,
};

// Render isolated input leaves in this deterministic harness without expanding ScheduleChip hooks.
function renderInputChildren(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(renderInputChildren);
  const component = node.type?.type ?? node.type;
  if (['ScheduleTextField', 'ScheduleInputChip'].includes(component?.name)) {
    const rendered = component(node.props);
    return { ...renderInputChildren(rendered), key: node.key };
  }
  return { ...node, props: { ...node.props, children: renderInputChildren(node.props?.children) } };
}
