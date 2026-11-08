import type { HolidayService } from '../../../services/holiday';
import { weekday } from '../../../utils/date';
import type { PlanEntry, RecurringPlan, RecurringPlanException } from '../types';

function isWithinPeriod(plan: RecurringPlan, date: string): boolean {
  const hasStarted = date >= plan.startDate;
  const hasNotEnded = plan.endDate === null || date <= plan.endDate;

  return hasStarted && hasNotEnded;
}

export function occursOn(plan: RecurringPlan, date: string, holidays: HolidayService): boolean {
  const isActiveDate = isWithinPeriod(plan, date);

  if (!isActiveDate) {
    return false;
  }

  const isHoliday = applicableHoliday(plan, date, holidays);
  const usesHolidaysOnly = plan.holidayPolicy === 'only';

  if (usesHolidaysOnly) {
    return isHoliday;
  }

  const isSelectedWeekday = plan.weekdays.includes(weekday(date));
  const isExcludedHoliday = plan.holidayPolicy === 'exclude' && isHoliday;

  return isSelectedWeekday && !isExcludedHoliday;
}

function matchesException(
  exception: RecurringPlanException | undefined,
  planId: string,
  date: string,
): boolean {
  return exception?.recurringPlanId === planId && exception.date === date;
}

function getRecurringTime(plan: RecurringPlan, exception?: RecurringPlanException): string | null {
  const timeOverride = exception?.time;
  const hasOverride = timeOverride !== undefined;

  if (hasOverride) {
    return timeOverride;
  }

  return plan.time;
}

export function recurringEntry(
  plan: RecurringPlan,
  date: string,
  holidays: HolidayService,
  exception?: RecurringPlanException,
): PlanEntry | null {
  const hasMatchingException = matchesException(exception, plan.id, date);
  const applicableException = hasMatchingException ? exception : undefined;
  const isVisible = occursOn(plan, date, holidays) && !applicableException?.cancelled;

  if (!isVisible) {
    return null;
  }

  const title = applicableException?.title ?? plan.title;
  const time = getRecurringTime(plan, applicableException);
  const timePrefix = time ? Number(time.slice(0, 2)) + time.slice(2) + ' ' : '';

  return {
    id: 'recurring:' + plan.id,
    sourceId: plan.id,
    kind: 'recurring',
    time,
    content: timePrefix + title,
    sortKey: plan.id,
  };
}

function applicableHoliday(plan: RecurringPlan, date: string, holidays: HolidayService): boolean {
  return plan.holidayPolicy !== 'include' && holidays.isHoliday(date);
}
