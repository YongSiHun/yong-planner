import type { RecurringPlan } from '../../planner/types';
import { weekdays } from '../../../utils/date';

export function toggleWeekday(days: number[], day: number): number[] {
  const isSelected = days.includes(day);

  if (isSelected) {
    return days.filter((value) => value !== day);
  }

  return [...days, day].sort((first, second) => first - second);
}

export function getRecurringSummary(plan: RecurringPlan): string {
  const usesHolidaysOnly = plan.holidayPolicy === 'only';

  if (usesHolidaysOnly) {
    return '공휴일만';
  }

  const excludesHolidays = plan.holidayPolicy === 'exclude';
  const holidaySuffix = excludesHolidays ? ' / 공휴일 제외' : '';

  return plan.weekdays.map((day) => weekdays[day]).join(' · ') + holidaySuffix;
}
