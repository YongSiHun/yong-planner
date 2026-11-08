import type { PlannerData, RecurringPlanException } from '../../features/planner/types';
import { readRecord, readUniqueList } from './readers';
import { readDailyItem, readOrder } from './dailyValidation';
import { readRecurringPlan, readException } from './recurringValidation';
import { readSettings, readOverride } from './settingsValidation';

// 복사: 검증 필드만 반영.
export function validateData(input: unknown): PlannerData {
  const root = readRecord(input);
  const recurringPlans = readUniqueList(root.recurringPlans, readRecurringPlan, (plan) => plan.id);
  const recurringIds = new Set(recurringPlans.map((plan) => plan.id));
  const readLinkedException = (value: unknown) => readException(value, recurringIds);
  const exceptionKey = (item: RecurringPlanException) =>
    JSON.stringify([item.recurringPlanId, item.date]);

  return {
    dailyPlanItems: readUniqueList(root.dailyPlanItems, readDailyItem, (item) => item.id),
    recurringPlans,
    recurringPlanExceptions: readUniqueList(
      root.recurringPlanExceptions,
      readLinkedException,
      exceptionKey,
    ),
    dailyPlanOrders: readUniqueList(root.dailyPlanOrders, readOrder, (order) => order.date),
    settings: readSettings(root.settings ?? { theme: 'system' }),
    holidayOverrides: readUniqueList(
      root.holidayOverrides ?? [],
      readOverride,
      (override) => override.date,
    ),
  };
}
export { ensureValid, readRecord, readText, readTimestamp } from './readers';
