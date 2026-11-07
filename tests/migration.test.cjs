require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const { migrate, initialSchema } = require('../src/database/migrations/index.ts');
function adapter(sqlite) {
  return {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    getFirstAsync: async (sql) => sqlite.prepare(sql).get(),
    withTransactionAsync: async (task) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
test('version 1 upgrade preserves schedules and can run repeatedly', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(initialSchema + 'PRAGMA user_version = 1;');
    sqlite
      .prepare('INSERT INTO daily_plan_items VALUES (?, ?, ?, ?)')
      .run('old', '2026-11-07', '기존 일정', '2026-11-01T00:00:00.000Z');
    await migrate(adapter(sqlite));
    await migrate(adapter(sqlite));
    const row = sqlite.prepare('SELECT * FROM daily_plan_items').get();
    assert.equal(row.content, '기존 일정');
    assert.equal(row.time, null);
    assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version, 2);
  } finally {
    sqlite.close();
  }
});
test('new database is initialized and future versions are rejected', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    await migrate(adapter(sqlite));
    assert.ok(
      sqlite
        .prepare('PRAGMA table_info(daily_plan_items)')
        .all()
        .some((column) => column.name === 'time'),
    );
    sqlite.exec('PRAGMA user_version = 3;');
    await assert.rejects(migrate(adapter(sqlite)), /더 최신 앱/);
    assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version, 3);
  } finally {
    sqlite.close();
  }
});
