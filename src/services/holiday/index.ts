import Holidays from 'date-holidays';
import type { HolidayOverride } from '../../features/planner/types';
export interface HolidayService {
  isHoliday(date: string): boolean;
  getHolidayName(date: string): string | null;
}
export function createHolidayService(overrides: HolidayOverride[] = []): HolidayService {
  const holidays = new Holidays('KR', {
    languages: 'ko',
    timezone: 'Asia/Seoul',
    types: ['public'],
  });
  const years = new Map<string, Map<string, string>>();
  const custom = new Map(overrides.map((o) => [o.date, o.name]));
  const getHolidayName = (date: string): string | null => {
    if (custom.has(date)) return custom.get(date) ?? null;
    const year = date.slice(0, 4);
    if (!years.has(year)) {
      const entries = new Map<string, string>();
      for (const h of holidays.getHolidays(Number(year))) {
        if (h.type === 'public') {
          const key = h.date.slice(0, 10);
          const prior = entries.get(key);
          entries.set(key, prior ? prior + ' · ' + h.name : h.name);
        }
      }
      years.set(year, entries);
    }
    return years.get(year)?.get(date) ?? null;
  };
  return { getHolidayName, isHoliday: (date) => getHolidayName(date) !== null };
}
