import { emptySelection, useNoteSelectionStore } from '../../../stores/noteSelection';
import { randomUUID } from 'expo-crypto';
import { persistData, restoreData } from '../../../database/repositories/persist';
import { loadData } from '../../../database/repositories/planner';
import { validateData } from '../../../services/backup';
import { usePlanner } from '../../../stores/planner';
import { parseDate, validTime } from '../../../utils/date';
import { updateDailyAlarms } from '../services/alarms';
import { editDailyContents } from '../services/noteEditing';
import { applyDailyNote } from '../services/note';
import { moveDailyNote as reorderDailyNote } from '../services/noteMove';
import { copyNoteToDates, copyNotesToDates, deleteSelectedNotes } from '../services/noteSelection';
import { type PlannerData, type RecurringPlan, type RecurringPlanException } from '../types';
import { WriteQueue } from './WriteQueue';

const queue = new WriteQueue();
let timer: ReturnType<typeof setTimeout> | undefined;
let initializing: Promise<void> | undefined;

export const initializePlanner = () => {
  const isReady = usePlanner.getState().ready;

  if (isReady) {
    return Promise.resolve();
  }

  const pendingInitialization = initializing;
  const isInitializing = pendingInitialization !== undefined;

  if (isInitializing) {
    return pendingInitialization;
  }

  initializing = loadData()
    .then((data) => {
      usePlanner.setState({ data, ready: true, error: null });
    })
    .catch((error: unknown) => {
      usePlanner.setState({ error: String(error) });
      throw error;
    })
    .finally(() => {
      initializing = undefined;
    });

  return initializing;
};

export const updatePlanner = (change: (data: PlannerData) => PlannerData, immediate = false) => {
  const state = usePlanner.getState();
  const isUnavailable = !state.ready || state.restoring;

  if (isUnavailable) {
    return;
  }
  const data = change(state.data);
  const isUnchanged = data === state.data;

  if (isUnchanged) {
    return;
  }

  usePlanner.setState({ data, dirty: true, revision: usePlanner.getState().revision + 1 });
  clearTimeout(timer);
  if (immediate) {
    void flushPlanner().catch(() => {});

    return;
  }

  timer = setTimeout(() => {
    void flushPlanner().catch(() => {});
  }, 500);
};

export const flushPlanner = async () => {
  clearTimeout(timer);
  await queue.enqueue(async () => {
    const hasPendingChanges = usePlanner.getState().dirty;

    if (!hasPendingChanges) {
      return;
    }
    usePlanner.setState({ saving: true });
    try {
      // 날짜 이동 전 추가 입력까지 커밋.
      while (usePlanner.getState().dirty) {
        const snapshot = usePlanner.getState();

        await persistData(snapshot.data);
        usePlanner.setState({
          dirty: usePlanner.getState().revision !== snapshot.revision,
          error: null,
        });
      }
    } catch (error) {
      usePlanner.setState({
        error: '저장하지 못했습니다. 입력은 유지되어 있습니다. 다시 저장해 주세요.',
      });
      throw error;
    } finally {
      usePlanner.setState({ saving: false });
    }
  });
};

export const restorePlanner = async (input: unknown) => {
  const data = validateData(input);
  const isRestoring = usePlanner.getState().restoring;

  if (isRestoring) {
    throw new Error('이미 복원 중입니다.');
  }
  usePlanner.setState({ restoring: true });
  try {
    await flushPlanner();
    await queue.enqueue(async () => {
      await restoreData(data);
      usePlanner.setState({
        data,
        dirty: false,
        error: null,
        revision: usePlanner.getState().revision + 1,
      });
      useNoteSelectionStore.setState(emptySelection());
    });
  } finally {
    usePlanner.setState({ restoring: false });
  }
};

export function saveRecurring(plan: RecurringPlan): void {
  updatePlanner(
    (data) =>
      validateData({
        ...data,
        recurringPlans: [...data.recurringPlans.filter((item) => item.id !== plan.id), plan],
      }),
    true,
  );
}
export function deleteRecurring(id: string): void {
  updatePlanner(
    (data) => ({
      ...data,
      recurringPlans: data.recurringPlans.filter((plan) => plan.id !== id),
      recurringPlanExceptions: data.recurringPlanExceptions.filter(
        (item) => item.recurringPlanId !== id,
      ),
    }),
    true,
  );
}
export function saveException(
  id: string,
  date: string,
  value: RecurringPlanException | null,
): void {
  updatePlanner(
    (data) =>
      validateData({
        ...data,
        recurringPlanExceptions: [
          ...data.recurringPlanExceptions.filter(
            (item) => !(item.recurringPlanId === id && item.date === date),
          ),
          ...(value ? [value] : []),
        ],
      }),
    true,
  );
}

export function saveDailyNote(date: string, text: string): void {
  updatePlanner((data) => applyDailyNote(data, date, text, randomUUID));
}

export function deleteDailyNotes(ids: ReadonlySet<string>) {
  updatePlanner((data) => deleteSelectedNotes(data, ids), true);
}

export function copyDailyNote(id: string, dates: string[]) {
  updatePlanner((data) => copyNoteToDates(data, id, dates, randomUUID), true);
}

export function saveDailyTime(id: string, time: string | null) {
  const isValid = validTime(time);

  if (!isValid) {
    throw new Error('시간을 확인해 주세요.');
  }
  updatePlanner(
    (data) => ({
      ...data,
      dailyPlanItems: data.dailyPlanItems.map((item) =>
        item.id === id ? { ...item, time, alarm: time ? item.alarm : undefined } : item,
      ),
    }),
    true,
  );
}

export function moveDailyNote(date: string, from: number, boundary: number): void {
  updatePlanner((data) => reorderDailyNote(data, date, from, boundary), true);
}

export function setTheme(theme: PlannerData['settings']['theme']): void {
  updatePlanner((data) => ({ ...data, settings: { ...data.settings, theme } }), true);
}

export function setTimeFormat(
  timeFormat: NonNullable<PlannerData['settings']['timeFormat']>,
): void {
  updatePlanner((data) => ({ ...data, settings: { ...data.settings, timeFormat } }), true);
}

export function removeHolidayOverride(date: string): void {
  updatePlanner(
    (data) => ({
      ...data,
      holidayOverrides: data.holidayOverrides.filter((override) => override.date !== date),
    }),
    true,
  );
}

export function saveHolidayOverride(date: string, name: string): void {
  parseDate(date);
  const blankName = name.length > 0 && name.trim().length === 0;

  if (blankName) {
    throw new Error('공휴일 이름을 확인해 주세요.');
  }
  updatePlanner(
    (data) => ({
      ...data,
      holidayOverrides: [
        ...data.holidayOverrides.filter((override) => override.date !== date),
        { date, name: name || null },
      ],
    }),
    true,
  );
}

export function copyDailyNotes(ids: ReadonlySet<string>, dates: string[]) {
  updatePlanner((data) => copyNotesToDates(data, ids, dates, randomUUID), true);
}

export function saveDailyTimes(ids: ReadonlySet<string>, time: string | null) {
  const valid = validTime(time);

  if (!valid) {
    throw new Error('시간을 확인해 주세요.');
  }
  updatePlanner(
    (data) => ({
      ...data,
      dailyPlanItems: data.dailyPlanItems.map((item) =>
        ids.has(item.id) ? { ...item, time, alarm: time ? item.alarm : undefined } : item,
      ),
    }),
    true,
  );
}

export function saveDailyContents(changes: ReadonlyMap<string, string>) {
  updatePlanner((data) => editDailyContents(data, changes, randomUUID), true);
}

export function setDailyImportant(ids: ReadonlySet<string>, important: boolean) {
  updatePlanner(
    (data) => ({
      ...data,
      dailyPlanItems: data.dailyPlanItems.map((item) =>
        ids.has(item.id) ? { ...item, important: important || undefined } : item,
      ),
    }),
    true,
  );
}

export function setDailyAlarms(ids: ReadonlySet<string>, alarm: boolean, time?: string) {
  updatePlanner((data) => updateDailyAlarms(data, ids, alarm, time), true);
}
