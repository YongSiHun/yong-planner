import type { DailyPlanItem, DailyPlanOrder, PlannerData, RecurringPlanException } from '../types';

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

export const dailyIndex = createIndex<DailyPlanItem>((item) => item.date);

export const exceptionIndex = createIndex<RecurringPlanException>((item) =>
  JSON.stringify([item.recurringPlanId, item.date]),
);

export const orderIndex = createIndex<DailyPlanOrder>((item) => item.date);

const dateExceptionIndex = createIndex<RecurringPlanException>((item) => item.date);

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

const NO_DAILY_ITEMS: DailyPlanItem[] = [];

export function dailyItemsForDate(data: PlannerData, date: string): DailyPlanItem[] {
  return dailyIndex(data.dailyPlanItems).get(date) ?? NO_DAILY_ITEMS;
}
