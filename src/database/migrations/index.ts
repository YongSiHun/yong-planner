export const SCHEMA_VERSION = 6;

export const initialSchema = `CREATE TABLE daily_plan_items (id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE INDEX daily_date ON daily_plan_items(date, createdAt);
CREATE TABLE recurring_plans (id TEXT PRIMARY KEY NOT NULL, startDate TEXT NOT NULL, endDate TEXT, payload TEXT NOT NULL);
CREATE INDEX recurring_range ON recurring_plans(startDate, endDate);
CREATE TABLE recurring_plan_exceptions (recurringPlanId TEXT NOT NULL REFERENCES recurring_plans(id) ON DELETE CASCADE, date TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(recurringPlanId, date));
CREATE INDEX exception_date ON recurring_plan_exceptions(date);
CREATE TABLE daily_plan_orders (date TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);
CREATE TABLE settings (id TEXT PRIMARY KEY NOT NULL CHECK(id = 'app'), payload TEXT NOT NULL);
CREATE TABLE holiday_overrides (date TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);`;

export const addDailyImportance =
  'ALTER TABLE daily_plan_items ADD COLUMN important INTEGER NOT NULL DEFAULT 0 CHECK(important IN (0, 1));';

export const addDailyAlarm =
  'ALTER TABLE daily_plan_items ADD COLUMN alarm INTEGER NOT NULL DEFAULT 0 CHECK(alarm IN (0, 1));';

export const addDailyTime = 'ALTER TABLE daily_plan_items ADD COLUMN time TEXT;';
export const addReadIndexes =
  'CREATE INDEX daily_created_order ON daily_plan_items(createdAt, id);';

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
    const isNewDatabase = version === 0;

    if (isNewDatabase) {
      await db.execAsync(initialSchema);
    }
    const needsTime = version < 2;

    if (needsTime) {
      await db.execAsync(addDailyTime);
    }
    const needsReadIndexes = version < 3;

    if (needsReadIndexes) {
      await db.execAsync(addReadIndexes);
    }
    const needsImportance = version < 4;

    if (needsImportance) {
      await db.execAsync(addDailyImportance);
    }
    await migrateAlarm(db, version);
    await db.execAsync('CREATE TABLE memos (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);');
    await db.execAsync('PRAGMA user_version = 6;');
  });
}

async function migrateAlarm(db: MigrationDatabase, version: number) {
  const needsAlarm = version < 5;

  if (needsAlarm) {
    await db.execAsync(addDailyAlarm);
  }
}
