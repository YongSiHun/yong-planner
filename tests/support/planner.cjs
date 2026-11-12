const { find } = require('./tree.cjs');
const { createModuleMock } = require('./mock-module.cjs');
require('./register.cjs');
const state = {};

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
const React = require('react');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
const { deleteSelectedNotes } = require('../../src/features/planner/services/noteSelection.ts');

function changeInput(input, text, eventCount = ++state.nativeEventCount) {
  input.props.onChange({ nativeEvent: { text, eventCount } });
}

const frames = new Map();

global.requestAnimationFrame = (callback) => {
  frames.set(++state.frameId, callback);
  return state.frameId;
};

global.cancelAnimationFrame = (id) => frames.delete(id);

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback());
}

const nativeInput = {
  focus: () => state.focused++,
  setSelection: (start, end) => state.selections.push({ start, end }),
};

const cacheMock = createModuleMock(require);

cacheMock('react', {
  ...React,
  useCallback: (callback) => callback,
  useMemo: (factory) => factory(),
  useState(initial) {
    const index = state.cursor++;
    if (!(index in state.slots))
      state.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [
      state.slots[index],
      (value) => {
        state.slots[index] = typeof value === 'function' ? value(state.slots[index]) : value;
      },
    ];
  },
  useRef(initial) {
    const index = state.cursor++;
    if (!(index in state.slots)) state.slots[index] = { current: initial };
    return state.slots[index];
  },
  useLayoutEffect(effect, deps) {
    const index = state.cursor++;
    const previous = state.slots[index];
    const changed = !previous || deps.some((value, position) => value !== previous.deps[position]);
    if (changed) {
      previous?.cleanup?.();
      const slot = { deps };
      state.slots[index] = slot;
      state.layoutEffects.push(() => {
        slot.cleanup = effect();
      });
    }
  },
  useEffect(effect) {
    const index = state.cursor++;
    if (!(index in state.slots)) state.slots[index] = { cleanup: effect() };
  },
});

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

const {
  ScheduleInput,
  SchedulePreview,
  ScheduleChip,
} = require('../../src/features/planner/components/ScheduleInput.tsx');

const { usePlannerGuide } = require('../../src/features/planner/hooks/usePlannerGuide.ts');
const { NOTE_INPUT_BOUNDARY: boundary } = require('../../src/features/planner/services/note.ts');

function renderInput(note = '회의,장보기', initialIndex, onSelect = () => {}, options = {}) {
  state.cursor = 0;
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
  state.layoutEffects.splice(0).forEach((effect) => effect());
  return { tree, input };
}

function renderGuide() {
  state.cursor = 0;
  // React 훅: 상태 유지 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePlannerGuide();
}

beforeEach(() => {
  state.slots = [];
  state.toasts = [];
  state.frameId = 0;
  state.alarmPermissionRequests = 0;
  state.alarmPermissionError = null;
  state.cursor = 0;
  state.saved = [];
  state.focused = 0;
  state.preferences = {};
  state.layoutEffects = [];
  state.selections = [];
  state.alerts = [];
  state.nativeEventCount = 0;
  state.plannerData = emptyData();
  state.selectionState = createSelection();
  state.dimensions = { height: 800, width: 360, fontScale: 1 };
  frames.clear();
});

const { useNoteSelection } = require('../../src/features/planner/hooks/useNoteSelection.ts');
const { SelectionBar } = require('../../src/features/planner/components/SelectionBar.tsx');
const { MonthPicker } = require('../../src/features/planner/components/MonthPicker.tsx');

function renderSelection() {
  state.cursor = 0;
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

cacheMock('../../src/features/planner/components/DraggableSchedulePreview.tsx', {
  DraggableSchedulePreview: function DraggableSchedulePreview() {},
});

cacheMock('../../src/features/planner/components/RecurringNote.tsx', {
  RecurringNote: 'RecurringNote',
});

const { DayRow } = require('../../src/features/planner/components/DayRow.tsx');
const { DayDate } = require('../../src/features/planner/components/DayDate.tsx');

module.exports = {
  DayDate,
  DayRow,
  MonthPicker,
  React,
  ScheduleChip,
  SchedulePreview,
  SelectionBar,
  applyDailyNote,
  boundary,
  buttonTitles,
  changeInput,
  find,
  flushFrames,
  renderGuide,
  renderInput,
  renderSelection,
  state,
};
