import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { router } from 'expo-router';
import { report } from '../../../components/ui';
import { usePlanner, addDaily, saveException } from '../../../stores/planner';
import { validTime } from '../../../utils/date';
import type { PlanEntry } from '../types';

export interface RecurringEdit {
  entry: PlanEntry;
  title: string;
  time: string;
}

interface DayEditorOptions {
  date: string;
  onDate(date: string): void;
  onClose(): void;
}

export function useDayEditor({ date, onDate, onClose }: DayEditorOptions) {
  const data = usePlanner((state) => state.data);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [actions, setActions] = useState<RecurringEdit | null>(null);
  const [exception, setException] = useState<RecurringEdit | null>(null);
  const navigationBusy = useRef(false);

  async function flushThen(action: () => void) {
    const isNavigating = navigationBusy.current;

    if (isNavigating) {
      return;
    }

    navigationBusy.current = true;

    try {
      await usePlanner.getState().flush();
      action();
    } catch (error) {
      report(error);
    } finally {
      navigationBusy.current = false;
    }
  }

  function handleClose() {
    void flushThen(() => {
      Keyboard.dismiss();
      onClose();
    });
  }

  function handleDateChange(nextDate: string) {
    const shouldKeepKeyboard = Keyboard.isVisible();

    void flushThen(() => {
      const firstItem = usePlanner
        .getState()
        .data.dailyPlanItems.find((item) => item.date === nextDate);

      setFocusId(shouldKeepKeyboard ? (firstItem?.id ?? null) : null);
      setCalendarOpen(false);
      onDate(nextDate);
    });
  }

  function handleCalendarOpen() {
    void flushThen(() => {
      Keyboard.dismiss();
      setCalendarOpen(true);
    });
  }

  function handleRecurringPress(entry: PlanEntry) {
    const plan = data.recurringPlans.find((item) => item.id === entry.sourceId);
    const hasPlan = plan !== undefined;

    if (!hasPlan) {
      return;
    }

    const previous = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === plan.id && item.date === date,
    );
    const timeOverride = previous?.time;
    const hasTimeOverride = timeOverride !== undefined;
    const time = hasTimeOverride ? timeOverride : plan.time;

    setActions({ entry, title: previous?.title ?? plan.title, time: time ?? '' });
  }

  function handleCancelOccurrence() {
    const hasActions = actions !== null;

    if (!hasActions) {
      return;
    }

    const recurringPlanId = actions.entry.sourceId;
    const previous = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === recurringPlanId && item.date === date,
    );

    saveException(recurringPlanId, date, { ...previous, recurringPlanId, date, cancelled: true });
    setActions(null);
  }

  function handleExceptionEdit() {
    setException(actions);
    setActions(null);
  }

  function handleExceptionReset() {
    const hasActions = actions !== null;

    if (!hasActions) {
      return;
    }

    saveException(actions.entry.sourceId, date, null);
    setActions(null);
  }

  function handleRecurringEdit() {
    const hasActions = actions !== null;

    if (!hasActions) {
      return;
    }

    const recurringPlanId = actions.entry.sourceId;

    void flushThen(() => {
      setActions(null);
      onClose();
      router.push({ pathname: '/recurring', params: { id: recurringPlanId } });
    });
  }

  function handleExceptionSave() {
    const hasException = exception !== null;

    if (!hasException) {
      return;
    }

    try {
      const hasValidTitle = exception.title.trim().length > 0;
      const time = exception.time || null;
      const hasValidTime = validTime(time);
      const isValidException = hasValidTitle && hasValidTime;

      if (!isValidException) {
        throw new Error('제목과 시간(HH:mm)을 확인해 주세요.');
      }

      const recurringPlanId = exception.entry.sourceId;

      saveException(recurringPlanId, date, {
        recurringPlanId,
        date,
        cancelled: false,
        title: exception.title,
        time,
      });
      setException(null);
    } catch (error) {
      report(error);
    }
  }

  function handleExceptionChange(patch: Partial<RecurringEdit>) {
    setException((previous) => (previous ? { ...previous, ...patch } : null));
  }

  function handleAddItem() {
    setFocusId(addDaily(date));
  }

  return {
    data,
    focusId,
    actions,
    exception,
    isCalendarOpen,
    handleClose,
    handleDateChange,
    handleCalendarOpen,
    handleRecurringPress,
    handleCancelOccurrence,
    handleExceptionEdit,
    handleExceptionReset,
    handleRecurringEdit,
    handleExceptionSave,
    handleExceptionChange,
    handleAddItem,
    handleRetrySave: () => {
      void flushThen(() => {});
    },
    closeCalendar: () => setCalendarOpen(false),
    closeActions: () => setActions(null),
    closeException: () => setException(null),
  };
}
