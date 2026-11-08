import type { HolidayService } from '../../../services/holiday';
import { weekday } from '../../../utils/date';
import type {
  DailyPlanItem,
  DailyPlanOrder,
  PlanEntry,
  PlannerData,
  RecurringPlan,
  RecurringPlanException,
} from '../types';
import { reconcileOrder } from './order';

// 불변 배열 키: 변경 목록만 재색인.
function createIndex<T>(key: (item: T) => string) {
  const cache = new WeakMap<T[], Map<string, T[]>>();
  let previousIndex = new Map<string, T[]>();

  return (items: T[]): Map<string, T[]> => {
    const cached = cache.get(items);
    const hasCached = cached !== undefined;

    if (hasCached) {
      return cached;
    }

    const index = new Map<string, T[]>();

    items.forEach((item) => {
      const itemKey = key(item);
      const bucket = index.get(itemKey) ?? [];

      bucket.push(item);
      index.set(itemKey, bucket);
    });
    index.forEach((bucket, itemKey) => {
      const previous = previousIndex.get(itemKey);
      const unchanged =
        previous?.length === bucket.length &&
        bucket.every((item, position) => item === previous[position]);

      if (unchanged) {
        index.set(itemKey, previous);
      }
    });
    previousIndex = index;
    cache.set(items, index);

    return index;
  };
}

const dailyIndex = createIndex<DailyPlanItem>((item) => item.date);
const exceptionIndex = createIndex<RecurringPlanException>((item) =>
  JSON.stringify([item.recurringPlanId, item.date]),
);
const orderIndex = createIndex<DailyPlanOrder>((item) => item.date);
const dateExceptionIndex = createIndex<RecurringPlanException>((item) => item.date);

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

function findException(data: PlannerData, recurringPlanId: string, date: string) {
  return exceptionIndex(data.recurringPlanExceptions).get(
    JSON.stringify([recurringPlanId, date]),
  )?.[0];
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

function createDailyEntry(item: DailyPlanItem): PlanEntry {
  return {
    id: 'daily:' + item.id,
    sourceId: item.id,
    kind: 'daily',
    content: item.content,
    ...(item.important ? { important: true } : {}),
    time: item.time ?? null,
    sortKey: item.createdAt + ':' + item.id,
  };
}

function isEntryVisible(entry: PlanEntry | null): entry is PlanEntry {
  return entry !== null;
}

export function plansForDate(
  data: PlannerData,
  date: string,
  holidays: HolidayService,
): PlanEntry[] {
  const dailyEntries = (dailyIndex(data.dailyPlanItems).get(date) ?? []).map(createDailyEntry);
  const recurringEntries = data.recurringPlans
    .map((plan) => recurringEntry(plan, date, holidays, findException(data, plan.id, date)))
    .filter(isEntryVisible);
  const customOrder = orderIndex(data.dailyPlanOrders).get(date)?.[0]?.itemIds;

  return reconcileOrder([...dailyEntries, ...recurringEntries], customOrder);
}

export function hasPlansForDate(
  data: PlannerData,
  date: string,
  holidays: HolidayService,
): boolean {
  const hasDaily = dailyIndex(data.dailyPlanItems).has(date);

  return (
    hasDaily ||
    data.recurringPlans.some(
      (plan) => occursOn(plan, date, holidays) && !findException(data, plan.id, date)?.cancelled,
    )
  );
}

function applicableHoliday(plan: RecurringPlan, date: string, holidays: HolidayService): boolean {
  return plan.holidayPolicy !== 'include' && holidays.isHoliday(date);
}

export function dateDependencies(data: PlannerData, date: string) {
  return [
    dailyIndex(data.dailyPlanItems).get(date),
    data.recurringPlans,
    dateExceptionIndex(data.recurringPlanExceptions).get(date),
    orderIndex(data.dailyPlanOrders).get(date)?.[0],
  ] as const;
}

export function exceptionsForDate(data: PlannerData, date: string): RecurringPlanException[] {
  return dateExceptionIndex(data.recurringPlanExceptions).get(date) ?? [];
}

export function dailyItemsForDate(data: PlannerData, date: string): DailyPlanItem[] {
  return dailyIndex(data.dailyPlanItems).get(date) ?? [];
}
