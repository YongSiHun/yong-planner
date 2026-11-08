import type { HolidayService } from '../../../services/holiday';
import type { DailyPlanItem, PlanEntry, PlannerData } from '../types';
import { reconcileOrder } from './order';
import { exceptionIndex, dailyIndex, orderIndex } from './planIndex';
import { recurringEntry, occursOn } from './recurrence';

function findException(data: PlannerData, recurringPlanId: string, date: string) {
  return exceptionIndex(data.recurringPlanExceptions).get(
    JSON.stringify([recurringPlanId, date]),
  )?.[0];
}

function createDailyEntry(item: DailyPlanItem): PlanEntry {
  return {
    id: 'daily:' + item.id,
    sourceId: item.id,
    kind: 'daily',
    content: item.content,
    ...(item.important ? { important: true } : {}),
    ...(item.alarm ? { alarm: true } : {}),
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
export { dateDependencies, exceptionsForDate, dailyItemsForDate } from './planIndex';
export { occursOn, recurringEntry } from './recurrence';
