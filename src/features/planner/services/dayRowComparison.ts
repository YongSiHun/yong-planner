import type { DayRowProps } from '../types/presentation';

function sameItems<T>(before: T[], after: T[], keys: (keyof T)[]): boolean {
  return (
    before.length === after.length &&
    before.every((item, index) => keys.every((key) => item[key] === after[index]![key]))
  );
}

export function areDayRowsEqual(before: DayRowProps, after: DayRowProps): boolean {
  const keys = [
    'date',
    'note',
    'timeFormat',
    'selectedIds',
    'selecting',
    'copying',
    'copyTarget',
    'copySourceDate',
    'onCopyDate',
    'onSelect',
    'onOutsidePress',
    'holidayName',
    'isToday',
    'isEditing',
    'onEdit',
    'onFinish',
    'onMeasure',
    'onInputFocus',
    'onInputLayout',
  ] as const;
  const sameValues = keys.every((key) => before[key] === after[key]);
  const sameRecurring = sameItems(before.recurring, after.recurring, [
    'id',
    'sourceId',
    'content',
    'time',
  ]);
  const sameExceptions = sameItems(before.exceptions, after.exceptions, [
    'recurringPlanId',
    'date',
    'cancelled',
    'title',
    'time',
  ]);

  const sameNoteIds =
    before.noteIds.length === after.noteIds.length &&
    before.noteIds.every(
      (id, index) =>
        id === after.noteIds[index] &&
        before.noteTimes[index] === after.noteTimes[index] &&
        before.noteImportant?.[index] === after.noteImportant?.[index],
    );

  return sameValues && sameRecurring && sameExceptions && sameNoteIds;
}
