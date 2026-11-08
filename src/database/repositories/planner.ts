import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { DailyPlanItem, PlannerData } from '../../features/planner/types';
import { emptyData } from '../../features/planner/types';
import { validateData } from '../../services/backup';
import { migrate } from '../migrations';
import { replaceRows } from './transactions';
let database: Promise<SQLiteDatabase> | undefined;

async function openPlannerDatabase(): Promise<SQLiteDatabase> {
  const connection = await openDatabaseAsync('yong-planner.db');

  try {
    await migrate(connection);

    return connection;
  } catch (error) {
    await connection.closeAsync().catch(() => {});
    throw error;
  }
}

export function getDatabase(): Promise<SQLiteDatabase> {
  const connection = database;
  const hasConnection = connection !== undefined;

  if (hasConnection) {
    return connection;
  }

  database = openPlannerDatabase().catch((error) => {
    database = undefined;
    throw error;
  });

  return database;
}

export async function loadData(): Promise<PlannerData> {
  const db = await getDatabase();
  const result = emptyData();

  const dailyRows = await db.getAllAsync<Omit<DailyPlanItem, 'important'> & { important: number }>(
    'SELECT id, date, content, createdAt, time, important FROM daily_plan_items ORDER BY createdAt, id',
  );

  result.dailyPlanItems = dailyRows.map(({ important, ...item }) =>
    important ? { ...item, important: true } : item,
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
// 복원: 직렬 큐 내 전체 데이터 원자 교체.
export async function replaceData(input: PlannerData): Promise<void> {
  const data = validateData(input);
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await replaceRows(db, data);
  });
}
