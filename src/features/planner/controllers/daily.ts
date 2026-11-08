import { randomUUID } from 'expo-crypto';
import { validTime } from '../../../utils/date';
import { updateDailyAlarms } from '../services/alarms';
import { editDailyContents } from '../services/noteEditing';
import { applyDailyNote } from '../services/note';
import { moveDailyNote as reorderDailyNote } from '../services/noteMove';
import { copyNoteToDates, copyNotesToDates, deleteSelectedNotes } from '../services/noteSelection';
import { updatePlanner } from './persistence';

export function saveDailyNote(date: string, text: string, replaceTimes = false): void {
  updatePlanner((data) => applyDailyNote(data, date, text, randomUUID, replaceTimes));
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
