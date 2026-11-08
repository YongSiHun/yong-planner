import type { PlannerData } from '../../features/planner/types';
export interface WriteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
}
export async function replaceRows(tx: WriteDatabase, data: PlannerData): Promise<void> {
  await tx.execAsync(
    'DELETE FROM recurring_plan_exceptions; DELETE FROM recurring_plans; DELETE FROM daily_plan_items; DELETE FROM daily_plan_orders; DELETE FROM settings; DELETE FROM holiday_overrides;',
  );
  await insertDailyRows(tx, data.dailyPlanItems);
  for (const p of data.recurringPlans) {
    await tx.runAsync(
      'INSERT INTO recurring_plans VALUES (?, ?, ?, ?)',
      p.id,
      p.startDate,
      p.endDate,
      JSON.stringify(p),
    );
  }
  for (const e of data.recurringPlanExceptions) {
    await tx.runAsync(
      'INSERT INTO recurring_plan_exceptions VALUES (?, ?, ?)',
      e.recurringPlanId,
      e.date,
      JSON.stringify(e),
    );
  }
  for (const o of data.dailyPlanOrders) {
    await tx.runAsync('INSERT INTO daily_plan_orders VALUES (?, ?)', o.date, JSON.stringify(o));
  }
  for (const o of data.holidayOverrides) {
    await tx.runAsync('INSERT INTO holiday_overrides VALUES (?, ?)', o.date, JSON.stringify(o));
  }
  await tx.runAsync("INSERT INTO settings VALUES ('app', ?)", JSON.stringify(data.settings));
}

async function insertDailyRows(
  tx: WriteDatabase,
  items: PlannerData['dailyPlanItems'],
): Promise<void> {
  for (const p of items) {
    await tx.runAsync(
      'INSERT INTO daily_plan_items (id, date, content, createdAt, time) VALUES (?, ?, ?, ?, ?)',
      p.id,
      p.date,
      p.content,
      p.createdAt,
      p.time ?? null,
    );
  }
}
