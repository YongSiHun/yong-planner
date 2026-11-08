import type { PlannerData } from '../../features/planner/types';
import { validateData } from '../../services/backup';
import { getDatabase, loadData, replaceData } from './planner';
let previous: PlannerData | undefined;

// Diff: 삭제·변경 분리.
async function synchronizeRows<T>(
  before: T[],
  after: T[],
  key: (item: T) => string,
  remove: (item: T) => Promise<unknown>,
  save: (item: T) => Promise<unknown>,
): Promise<void> {
  const previousRows = new Map(before.map((item) => [key(item), JSON.stringify(item)]));
  const currentKeys = new Set(after.map(key));
  const removed = before.filter((item) => !currentKeys.has(key(item)));
  const changed = after.filter((item) => previousRows.get(key(item)) !== JSON.stringify(item));

  for (const item of removed) {
    await remove(item);
  }
  for (const item of changed) {
    await save(item);
  }
}

export async function persistData(input: PlannerData): Promise<void> {
  const data = validateData(input);
  const db = await getDatabase();
  const before = previous ?? (await loadData());

  // 저장: FK 활성 연결·직렬 큐 공유.
  await db.withTransactionAsync(async () => {
    // 부모 삭제 → FK CASCADE로 예외 삭제.
    await synchronizeRows(
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
    await synchronizeRows(
      before.dailyPlanItems,
      data.dailyPlanItems,
      (p) => p.id,
      (p) => db.runAsync('DELETE FROM daily_plan_items WHERE id = ?', p.id),
      (p) =>
        db.runAsync(
          'INSERT INTO daily_plan_items (id, date, content, createdAt, time, important, alarm) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, content=excluded.content, createdAt=excluded.createdAt, time=excluded.time, important=excluded.important, alarm=excluded.alarm',
          p.id,
          p.date,
          p.content,
          p.createdAt,
          p.time ?? null,
          Number(Boolean(p.important)),
          Number(Boolean(p.alarm)),
        ),
    );
    await synchronizeRows(
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
    await synchronizeRows(
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
    await synchronizeRows(
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
    const settingsChanged = JSON.stringify(before.settings) !== JSON.stringify(data.settings);

    if (settingsChanged) {
      await db.runAsync(
        "INSERT INTO settings VALUES ('app', ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        JSON.stringify(data.settings),
      );
    }
  });
  previous = data;
}
export async function restoreData(data: PlannerData): Promise<void> {
  await replaceData(data);
  previous = data;
}
