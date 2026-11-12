import { parseDate } from '../../../utils/date';
import { holidayNameError } from '../../settings/services/holidayValidation';
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
  const error = holidayNameError(name);

  if (error) {
    throw new Error(error);
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
