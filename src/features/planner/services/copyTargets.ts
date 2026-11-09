import { createHolidayService } from '../../../services/holiday';
import type { PlannerData } from '../types';
import { plansForDate } from './plans';
import { parseScheduleTimePrefix } from './time';

export const COPY_SINGLE_MESSAGE = '일정 복사는 하나만 가능해요.';
export const COPY_DUPLICATE_MESSAGE = '이미 같은 일정이 있는 날짜에는 복사할 수 없어요.';

export function copyScheduleKey(item: {
  content: string;
  time?: string | null;
  kind?: string;
}): string {
  const recurringTime = item.kind === 'recurring' && Boolean(item.time);
  const content = recurringTime ? parseScheduleTimePrefix(item.content).content : item.content;

  return JSON.stringify([content.trim(), item.time ?? null]);
}

export function hasCopyConflict(
  data: PlannerData,
  ids: ReadonlySet<string>,
  date: string,
): boolean {
  const sourceKeys = new Set(
    data.dailyPlanItems.filter((item) => ids.has(item.id)).map(copyScheduleKey),
  );
  const holidays = createHolidayService(data.holidayOverrides);

  return plansForDate(data, date, holidays).some((item) => sourceKeys.has(copyScheduleKey(item)));
}
