import { randomUUID } from 'expo-crypto';
import { noteLengthError } from '../../../services/schedule';
import { parseDate, validTime } from '../../../utils/date';
import { timeChangeClearsAlarm, updateDailyAlarms } from '../services/alarms';
import { applyDailyNote, finalizeDailyNote } from '../services/noteItems';
import { moveDailyNote as reorderDailyNote } from '../services/noteMove';
import { copyNotesToDates, deleteSelectedNotes } from '../services/noteSelection';
import { stagePlannerChange, updatePlanner } from './persistence';
import type { PlannerData } from '../types';

export function saveDailyNote(date: string, text: string, replaceTimes = false): void {
  updatePlanner(dailyNoteChange(date, text, replaceTimes));
}

export function stageDailyNote(date: string, text: string, replaceTimes = false): void {
  stagePlannerChange(date, dailyNoteChange(date, text, replaceTimes));
}

function dailyNoteChange(date: string, text: string, replaceTimes: boolean) {
  parseDate(date);
  const error = noteLengthError(text);

  if (error) {
    throw new Error(error);
  }

  return (data: PlannerData) => applyDailyNote(data, date, text, randomUUID, replaceTimes);
}

export function deleteDailyNotes(ids: ReadonlySet<string>) {
  updatePlanner((data) => deleteSelectedNotes(data, ids), true);
}

export function moveDailyNote(date: string, from: number, boundary: number): void {
  updatePlanner((data) => reorderDailyNote(data, date, from, boundary), true);
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
        ids.has(item.id)
          ? { ...item, time, alarm: timeChangeClearsAlarm(item, time) ? undefined : item.alarm }
          : item,
      ),
    }),
    true,
  );
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

export function finishDailyNote(date: string): void {
  parseDate(date);
  updatePlanner((data) => finalizeDailyNote(data, date));
}
