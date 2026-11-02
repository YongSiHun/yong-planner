import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type {
  PlannerData,
  DailyPlanItem,
  RecurringPlan,
  RecurringPlanException,
  DailyPlanOrder,
} from '../../features/planner/types';
import { emptyData } from '../../features/planner/types';
import { validateData } from '../../services/backup';
import { migrate } from '../migrations';
import { replaceRows } from './transactions';
let database: Promise<SQLiteDatabase> | undefined;
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!database)
    database = openDatabaseAsync('yong-planner.db')
      .then(async (db) => {
        try {
          await migrate(db);
          return db;
        } catch (error) {
          await db.closeAsync().catch(() => {});
          throw error;
        }
      })
      .catch((error) => {
        database = undefined;
        throw error;
      });
  return database;
}
export async function loadData(): Promise<PlannerData> {
  const db = await getDatabase();
  const result = emptyData();
  result.dailyPlanItems = await db.getAllAsync<DailyPlanItem>(
    'SELECT * FROM daily_plan_items ORDER BY createdAt, id',
  );
  const payloads = async <T>(table: string): Promise<T[]> =>
    (await db.getAllAsync<{ payload: string }>('SELECT payload FROM ' + table)).map(
      (r) => JSON.parse(r.payload) as T,
    );
  result.recurringPlans = await payloads('recurring_plans');
  result.recurringPlanExceptions = await payloads('recurring_plan_exceptions');
  result.dailyPlanOrders = await payloads('daily_plan_orders');
  result.holidayOverrides = await payloads('holiday_overrides');
  result.settings = (await payloads<PlannerData['settings']>('settings'))[0] ?? result.settings;
  return validateData(result);
}
// Called only by the store's serialized writer. A whole snapshot is atomic;
// transaction failure leaves the previous data intact.
export async function replaceData(input: PlannerData): Promise<void> {
  const data = validateData(input);
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await replaceRows(db, data);
  });
}
export async function queryDailyRange(start: string, end: string): Promise<DailyPlanItem[]> {
  return (await getDatabase()).getAllAsync(
    'SELECT * FROM daily_plan_items WHERE date >= ? AND date <= ? ORDER BY date, createdAt, id',
    start,
    end,
  );
}
export async function queryMonth(month: string): Promise<{
  daily: DailyPlanItem[];
  recurring: RecurringPlan[];
  exceptions: RecurringPlanException[];
  orders: DailyPlanOrder[];
}> {
  const db = await getDatabase();
  const start = month + '-01';
  const end = month + '-31';
  const payloads = async <T>(sql: string): Promise<T[]> =>
    (await db.getAllAsync<{ payload: string }>(sql, start, end)).map(
      (r) => JSON.parse(r.payload) as T,
    );
  return {
    daily: await queryDailyRange(start, end),
    recurring: (
      await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM recurring_plans WHERE startDate <= ? AND (endDate IS NULL OR endDate >= ?)',
        end,
        start,
      )
    ).map((r) => JSON.parse(r.payload) as RecurringPlan),
    exceptions: await payloads(
      'SELECT payload FROM recurring_plan_exceptions WHERE date >= ? AND date <= ?',
    ),
    orders: await payloads('SELECT payload FROM daily_plan_orders WHERE date >= ? AND date <= ?'),
  };
}
