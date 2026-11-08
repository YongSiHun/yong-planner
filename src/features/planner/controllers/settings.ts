import { parseDate } from '../../../utils/date';
import { type PlannerData } from '../types';
import { updatePlanner } from './persistence';

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
