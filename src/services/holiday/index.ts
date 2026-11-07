import Holidays from 'date-holidays';
import type { HolidayOverride } from '../../features/planner/types';

export interface HolidayService {
  isHoliday(date: string): boolean;
  getHolidayName(date: string): string | null;
}

function collectYearHolidays(holidays: Holidays, year: string): Map<string, string> {
  const entries = new Map<string, string>();
  const publicHolidays = holidays
    .getHolidays(Number(year))
    .filter((holiday) => holiday.type === 'public');

  publicHolidays.forEach((holiday) => {
    const date = holiday.date.slice(0, 10);
    const previousName = entries.get(date);
    const name = previousName ? previousName + ' · ' + holiday.name : holiday.name;

    entries.set(date, name);
  });

  return entries;
}

// 기본 공휴일은 편집기·달력·내보내기에서 공유하고 사용자 수정은 분리한다.
let holidays: Holidays | undefined;
const years = new Map<string, Map<string, string>>();

function getYear(year: string): Map<string, string> {
  const cachedYear = years.get(year);
  const hasCachedYear = cachedYear !== undefined;

  if (hasCachedYear) {
    return cachedYear;
  }

  holidays ??= new Holidays('KR', {
    languages: 'ko',
    timezone: 'Asia/Seoul',
    types: ['public'],
  });
  const entries = collectYearHolidays(holidays, year);

  years.set(year, entries);
  const exceedsCacheLimit = years.size > 16;

  if (exceedsCacheLimit) {
    years.delete(years.keys().next().value!);
  }

  return entries;
}

export function createHolidayService(overrides: HolidayOverride[] = []): HolidayService {
  const customHolidays = new Map(overrides.map((override) => [override.date, override.name]));

  function getHolidayName(date: string): string | null {
    const hasOverride = customHolidays.has(date);

    if (hasOverride) {
      return customHolidays.get(date) ?? null;
    }

    return getYear(date.slice(0, 4)).get(date) ?? null;
  }

  return { getHolidayName, isHoliday: (date) => getHolidayName(date) !== null };
}
