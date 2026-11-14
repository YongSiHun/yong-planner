import type { PlannerData, RecurringPlan } from '../../features/planner/types';
import { monthDates, parseDate } from '../../utils/date';
import { validateData } from './validation';

export type PlannerBackup = PlannerData & { month?: string; kind?: 'notes' | 'full' };

export function backupMonth(value: unknown): string {
  const valid = typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);

  if (!valid) {
    throw new Error('백업 월은 YYYY-MM 형식이어야 합니다.');
  }
  parseDate(value + '-01');

  return value;
}

export function monthData(data: PlannerData, month: string): PlannerBackup {
  const key = backupMonth(month.slice(0, 7));
  const dates = monthDates(key);
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const inMonth = (item: { date: string }) => item.date.startsWith(key + '-');
  const recurringPlans = data.recurringPlans
    .filter((plan) => plan.startDate <= last && (plan.endDate ?? last) >= first)
    .map((plan) => ({
      ...plan,
      startDate: plan.startDate < first ? first : plan.startDate,
      endDate: plan.endDate === null || plan.endDate > last ? last : plan.endDate,
    }));
  const ids = new Set(recurringPlans.map((plan) => plan.id));

  return {
    ...data,
    month: key,
    memos: [],
    dailyPlanItems: data.dailyPlanItems.filter(inMonth),
    recurringPlans,
    recurringPlanExceptions: data.recurringPlanExceptions.filter(
      (item) => inMonth(item) && ids.has(item.recurringPlanId),
    ),
    dailyPlanOrders: data.dailyPlanOrders.filter(inMonth),
    holidayOverrides: data.holidayOverrides.filter(inMonth),
  };
}

function overlapsMonth(plan: RecurringPlan, first: string, last: string): boolean {
  return plan.startDate <= last && (plan.endDate ?? last) >= first;
}

function extendsPast(plan: RecurringPlan, last: string): boolean {
  return plan.endDate === null || plan.endDate > last;
}

// 월 경계 밖의 반복 일정은 구간을 나눠 유지한다.
function outsideSegments(plan: RecurringPlan, first: string, last: string, fresh: () => string) {
  const overlaps = overlapsMonth(plan, first, last);

  if (!overlaps) {
    return [plan];
  }
  const segments: RecurringPlan[] = [];
  const hasBefore = plan.startDate < first;
  const hasAfter = extendsPast(plan, last);
  const afterId = hasBefore ? fresh() : plan.id;

  if (hasBefore) {
    const before = new Date(first + 'T12:00:00Z');

    before.setUTCDate(before.getUTCDate() - 1);
    segments.push({ ...plan, endDate: before.toISOString().slice(0, 10) });
  }
  if (hasAfter) {
    const after = new Date(last + 'T12:00:00Z');

    after.setUTCDate(after.getUTCDate() + 1);
    segments.push({ ...plan, id: afterId, startDate: after.toISOString().slice(0, 10) });
  }

  return segments;
}

export function mergeMonthBackup(current: PlannerData, backup: PlannerBackup): PlannerData {
  const month = backupMonth(backup.month);
  const incoming = monthData(backup, month);
  const dates = monthDates(month);
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const outside = (item: { date: string }) => !item.date.startsWith(month + '-');
  const used = new Set(
    [...current.dailyPlanItems, ...current.recurringPlans].map((item) => item.id),
  );
  let serial = 0;
  const fresh = () => {
    while (used.has('restored-' + serial)) {
      serial++;
    }
    const id = 'restored-' + serial++;

    used.add(id);

    return id;
  };
  const segments = new Map(
    current.recurringPlans.map((plan) => [plan.id, outsideSegments(plan, first, last, fresh)]),
  );
  const segmentId = (id: string, date: string) =>
    segments.get(id)?.find((plan) => plan.startDate <= date && (plan.endDate ?? date) >= date)
      ?.id ?? id;
  const dailyIds = new Map(incoming.dailyPlanItems.map((item) => [item.id, fresh()]));
  const recurringIds = new Map(incoming.recurringPlans.map((plan) => [plan.id, fresh()]));
  const orderId = (id: string) => {
    const [kind, ...parts] = id.split(':');
    const source = parts.join(':');
    const ids = kind === 'daily' ? dailyIds : recurringIds;

    return kind + ':' + (ids.get(source) ?? source);
  };

  return validateData({
    ...current,
    dailyPlanItems: [
      ...current.dailyPlanItems.filter(outside),
      ...incoming.dailyPlanItems.map((item) => ({ ...item, id: dailyIds.get(item.id)! })),
    ],
    recurringPlans: [
      ...Array.from(segments.values()).flat(),
      ...incoming.recurringPlans.map((plan) => ({ ...plan, id: recurringIds.get(plan.id)! })),
    ],
    recurringPlanExceptions: [
      ...current.recurringPlanExceptions
        .filter(outside)
        .filter((item) => (segments.get(item.recurringPlanId)?.length ?? 0) > 0)
        .map((item) => ({ ...item, recurringPlanId: segmentId(item.recurringPlanId, item.date) })),
      ...incoming.recurringPlanExceptions.map((item) => ({
        ...item,
        recurringPlanId: recurringIds.get(item.recurringPlanId)!,
      })),
    ],
    dailyPlanOrders: [
      ...current.dailyPlanOrders.filter(outside).map((order) => ({
        ...order,
        itemIds: order.itemIds.map((id) =>
          id.startsWith('recurring:') ? 'recurring:' + segmentId(id.slice(10), order.date) : id,
        ),
      })),
      ...incoming.dailyPlanOrders.map((order) => ({
        ...order,
        itemIds: order.itemIds.map(orderId),
      })),
    ],
    holidayOverrides: [...current.holidayOverrides.filter(outside), ...incoming.holidayOverrides],
  });
}
