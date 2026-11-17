import type { DayRowProps } from '../types/presentation';

function sameItems<T>(before: T[], after: T[], keys: (keyof T)[]): boolean {
  return (
    before === after ||
    (before.length === after.length &&
      before.every((item, index) => keys.every((key) => item[key] === after[index]![key])))
  );
}

const VALUE_KEYS = [
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
  'onChipScrollLock',
  'holidayName',
  'isToday',
  'isEditing',
  'onEdit',
  'onFinish',
  'onMeasure',
  'onInputFocus',
  'onInputLayout',
] as const;

export function areDayRowsEqual(before: DayRowProps, after: DayRowProps): boolean {
  const sameValues = VALUE_KEYS.every((key) => before[key] === after[key]);
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
        before.noteImportant?.[index] === after.noteImportant?.[index] &&
        before.noteAlarms?.[index] === after.noteAlarms?.[index],
    );

  return sameValues && sameRecurring && sameExceptions && sameNoteIds;
}
