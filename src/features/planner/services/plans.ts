import { reconcileOrder } from './order';
export { defaultSort, reconcileOrder, moveEntry } from './order';
import type { PlannerData, PlanEntry, RecurringPlan, RecurringPlanException } from '../types';
import type { HolidayService } from '../../../services/holiday';
import { weekday } from '../../../utils/date';
export function occursOn(plan: RecurringPlan, date: string, holidays: HolidayService): boolean {
  if (date < plan.startDate || (plan.endDate !== null && date > plan.endDate)) return false;
  const holiday = holidays.isHoliday(date);
  if (plan.holidayPolicy === 'only') return holiday;
  return plan.weekdays.includes(weekday(date)) && (plan.holidayPolicy !== 'exclude' || !holiday);
}
export function recurringEntry(
  plan: RecurringPlan,
  date: string,
  holidays: HolidayService,
  exception?: RecurringPlanException,
): PlanEntry | null {
  if (exception && (exception.recurringPlanId !== plan.id || exception.date !== date))
    exception = undefined;
  if (!occursOn(plan, date, holidays) || exception?.cancelled) return null;
  const title = exception?.title ?? plan.title;
  const time = exception?.time !== undefined ? exception.time : plan.time;
  return {
    id: 'recurring:' + plan.id,
    sourceId: plan.id,
    kind: 'recurring',
    time,
    content: (time ? Number(time.slice(0, 2)) + time.slice(2) + ' ' : '') + title,
    sortKey: plan.id,
  };
}
export function plansForDate(
  data: PlannerData,
  date: string,
  holidays: HolidayService,
): PlanEntry[] {
  const entries: PlanEntry[] = data.dailyPlanItems
    .filter((p) => p.date === date)
    .map((p) => ({
      id: 'daily:' + p.id,
      sourceId: p.id,
      kind: 'daily',
      content: p.content,
      time: null,
      sortKey: p.createdAt + ':' + p.id,
    }));
  for (const plan of data.recurringPlans) {
    const entry = recurringEntry(
      plan,
      date,
      holidays,
      data.recurringPlanExceptions.find((e) => e.recurringPlanId === plan.id && e.date === date),
    );
    if (entry) entries.push(entry);
  }
  return reconcileOrder(entries, data.dailyPlanOrders.find((o) => o.date === date)?.itemIds);
}
