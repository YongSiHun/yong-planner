export const SCHEMA_VERSION = 1;

export const initialSchema = `CREATE TABLE daily_plan_items (id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE INDEX daily_date ON daily_plan_items(date, createdAt);
CREATE TABLE recurring_plans (id TEXT PRIMARY KEY NOT NULL, startDate TEXT NOT NULL, endDate TEXT, payload TEXT NOT NULL);
CREATE INDEX recurring_range ON recurring_plans(startDate, endDate);
CREATE TABLE recurring_plan_exceptions (recurringPlanId TEXT NOT NULL REFERENCES recurring_plans(id) ON DELETE CASCADE, date TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(recurringPlanId, date));
CREATE INDEX exception_date ON recurring_plan_exceptions(date);
CREATE TABLE daily_plan_orders (date TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);
CREATE TABLE settings (id TEXT PRIMARY KEY NOT NULL CHECK(id = 'app'), payload TEXT NOT NULL);
CREATE TABLE holiday_overrides (date TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);`;

export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export async function migrate(db: MigrationDatabase): Promise<void> {
  await db.execAsync(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;',
  );
  const version =
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  const isFutureVersion = version > SCHEMA_VERSION;

  if (isFutureVersion) {
    throw new Error('더 최신 앱에서 생성된 데이터베이스입니다. 앱을 업데이트해 주세요.');
  }

  const isCurrentVersion = version >= SCHEMA_VERSION;

  if (isCurrentVersion) {
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync(initialSchema);
    await db.execAsync('PRAGMA user_version = 1;');
  });
}
