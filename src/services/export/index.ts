import { csvCell, wrapText } from './text';
export { csvCell, displayWidth, graphemes, wrapText } from './text';
import type { PlannerData } from '../../features/planner/types';
import type { HolidayService } from '../holiday';
import { monthDates, monthLabel, weekday, weekdays } from '../../utils/date';
import { plansForDate } from '../../features/planner/services/plans';
export function monthTxt(
  data: PlannerData,
  month: string,
  holidays: HolidayService,
  columns = 72,
): string {
  return (
    monthLabel(month) +
    '\n\n' +
    monthDates(month)
      .map((date) =>
        wrapText(
          plansForDate(data, date, holidays)
            .map((e) => e.content)
            .join(', '),
          Number(date.slice(8)) + weekdays[weekday(date)]! + ' ',
          columns,
        ),
      )
      .join('\n\n')
  );
}
export function monthCsv(data: PlannerData, month: string, holidays: HolidayService): string {
  return (
    '\uFEFFdate,weekday,content\r\n' +
    monthDates(month)
      .map((date) =>
        [
          date,
          weekdays[weekday(date)],
          csvCell(
            plansForDate(data, date, holidays)
              .map((e) => e.content)
              .join(', '),
          ),
        ].join(','),
      )
      .join('\r\n')
  );
}
