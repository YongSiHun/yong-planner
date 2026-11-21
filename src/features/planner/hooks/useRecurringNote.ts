import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { report } from '../../../components/ui';
import { useScheduleText } from '../../../hooks/useScheduleText';
import { usePlanner } from '../../../stores/planner';
import { validTime } from '../../../utils/date';
import { displayPlanEntry } from '../services/time';
import type { PlanEntry } from '../types';
import { usePlannerActions } from './usePlannerActions';

export function useRecurringNote(entry: PlanEntry, date: string) {
  const format = usePlanner((state) => state.data.settings.timeFormat ?? '24h');
  const { saveException } = usePlannerActions();
  const displayContent = displayPlanEntry(entry, format);
  const titleInput = useRef<ComponentRef<typeof TextInput>>(null);
  const timeInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const changeTitle = useScheduleText(setTitle);
  const [time, setTime] = useState('');

  function startEditing() {
    Keyboard.dismiss();
    const data = usePlanner.getState().data;
    const plan = data.recurringPlans.find((item) => item.id === entry.sourceId);
    const missing = plan === undefined;

    if (missing) {
      report(new Error('삭제된 반복 일정입니다. 화면을 다시 열어 주세요.'));

      return;
    }
    const exception = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === plan.id && item.date === date,
    );

    setTitle(exception?.title ?? plan.title);
    setTime((exception?.time === undefined ? plan.time : exception.time) ?? '');
    setEditing(true);
  }

  function save() {
    const savedTime = time || null;
    const isValid = title.trim().length > 0 && validTime(savedTime);

    if (!isValid) {
      report(new Error('제목과 시간(HH:mm)을 확인해 주세요.'));

      return;
    }
    try {
      saveException(entry.sourceId, date, {
        recurringPlanId: entry.sourceId,
        date,
        cancelled: false,
        title,
        time: savedTime,
      });
      Keyboard.dismiss();
      setEditing(false);
    } catch (error) {
      report(error);
    }
  }

  function close() {
    Keyboard.dismiss();
    setEditing(false);
  }

  function cancel() {
    try {
      saveException(entry.sourceId, date, {
        recurringPlanId: entry.sourceId,
        date,
        cancelled: true,
      });
      close();
    } catch (error) {
      report(error);
    }
  }

  function openSeries() {
    Keyboard.dismiss();
    router.push({ pathname: '/recurring', params: { id: entry.sourceId } });
  }

  return {
    displayContent,
    titleInput,
    timeInput,
    editing,
    title,
    changeTitle,
    time,
    setTime,
    startEditing,
    save,
    close,
    cancel,
    openSeries,
  };
}
