import type { PlannerData } from '../../features/planner/types';
import { getDatabase, loadData, replaceData } from './planner';
import { validateData } from '../../services/backup';
let previous: PlannerData | undefined;
export async function persistData(input: PlannerData): Promise<void> {
  const data = validateData(input);
  const db = await getDatabase();
  const before = previous ?? (await loadData());
  const sync = async <T>(
    old: T[],
    next: T[],
    key: (p: T) => string,
    remove: (p: T) => Promise<unknown>,
    insert: (p: T) => Promise<unknown>,
  ) => {
    const prior = new Map(old.map((p) => [key(p), JSON.stringify(p)]));
    const current = new Set(next.map(key));
    for (const p of old) if (!current.has(key(p))) await remove(p);
    for (const p of next) if (prior.get(key(p)) !== JSON.stringify(p)) await insert(p);
  };
  // This connection has foreign_keys enabled. All writes use the store queue;
  // no unrelated writes can enter this transaction.
  await db.withTransactionAsync(async () => {
    const exceptionKeys = new Set(
      data.recurringPlanExceptions.map((e) => JSON.stringify([e.recurringPlanId, e.date])),
    );
    for (const e of before.recurringPlanExceptions)
      if (!exceptionKeys.has(JSON.stringify([e.recurringPlanId, e.date])))
        await db.runAsync(
          'DELETE FROM recurring_plan_exceptions WHERE recurringPlanId = ? AND date = ?',
          e.recurringPlanId,
          e.date,
        );
    await sync(
      before.recurringPlans,
      data.recurringPlans,
      (p) => p.id,
      (p) => db.runAsync('DELETE FROM recurring_plans WHERE id = ?', p.id),
      (p) =>
        db.runAsync(
          'INSERT INTO recurring_plans VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET startDate=excluded.startDate, endDate=excluded.endDate, payload=excluded.payload',
          p.id,
          p.startDate,
          p.endDate,
          JSON.stringify(p),
        ),
    );
    await sync(
      before.dailyPlanItems,
      data.dailyPlanItems,
      (p) => p.id,
      (p) => db.runAsync('DELETE FROM daily_plan_items WHERE id = ?', p.id),
      (p) =>
        db.runAsync(
          'INSERT INTO daily_plan_items VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, content=excluded.content, createdAt=excluded.createdAt',
          p.id,
          p.date,
          p.content,
          p.createdAt,
        ),
    );
    await sync(
      before.recurringPlanExceptions,
      data.recurringPlanExceptions,
      (p) => JSON.stringify([p.recurringPlanId, p.date]),
      (p) =>
        db.runAsync(
          'DELETE FROM recurring_plan_exceptions WHERE recurringPlanId = ? AND date = ?',
          p.recurringPlanId,
          p.date,
        ),
      (p) =>
        db.runAsync(
          'INSERT INTO recurring_plan_exceptions VALUES (?, ?, ?) ON CONFLICT(recurringPlanId, date) DO UPDATE SET payload=excluded.payload',
          p.recurringPlanId,
          p.date,
          JSON.stringify(p),
        ),
    );
    await sync(
      before.dailyPlanOrders,
      data.dailyPlanOrders,
      (p) => p.date,
      (p) => db.runAsync('DELETE FROM daily_plan_orders WHERE date = ?', p.date),
      (p) =>
        db.runAsync(
          'INSERT INTO daily_plan_orders VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET payload=excluded.payload',
          p.date,
          JSON.stringify(p),
        ),
    );
    await sync(
      before.holidayOverrides,
      data.holidayOverrides,
      (p) => p.date,
      (p) => db.runAsync('DELETE FROM holiday_overrides WHERE date = ?', p.date),
      (p) =>
        db.runAsync(
          'INSERT INTO holiday_overrides VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET payload=excluded.payload',
          p.date,
          JSON.stringify(p),
        ),
    );
    await db.runAsync(
      "INSERT INTO settings VALUES ('app', ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      JSON.stringify(data.settings),
    );
  });
  previous = data;
}
export async function restoreData(data: PlannerData): Promise<void> {
  await replaceData(data);
  previous = data;
}
