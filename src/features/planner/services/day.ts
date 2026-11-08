import type { HolidayService } from '../../../services/holiday';
import type { PlannerData } from '../types';
import { dateDependencies, exceptionsForDate, plansForDate } from './plans';

function buildDay(data: PlannerData, date: string, holidays: HolidayService) {
  const entries = plansForDate(data, date, holidays);
  const daily = entries.filter((entry) => entry.kind === 'daily');

  return {
    noteTimes: daily.map((entry) => entry.time),
    noteIds: daily.map((entry) => entry.sourceId),
    note: daily.map((entry) => entry.content).join(','),
    recurring: entries.filter((entry) => entry.kind === 'recurring'),
    exceptions: exceptionsForDate(data, date),
    holidayName: holidays.getHolidayName(date),
  };
}

// 날짜별 참조 유지: 변경 행만 렌더.
export function createDaySelector(date: string, holidays: HolidayService) {
  let previous: ReturnType<typeof dateDependencies> | undefined;
  let result: ReturnType<typeof buildDay>;

  return (data: PlannerData) => {
    const dependencies = dateDependencies(data, date);
    const unchanged =
      previous !== undefined && dependencies.every((value, index) => value === previous![index]);

    if (unchanged) {
      return result;
    }
    previous = dependencies;
    result = buildDay(data, date, holidays);

    return result;
  };
}
