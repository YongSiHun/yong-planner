require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const {
  migrate,
  initialSchema,
  SCHEMA_VERSION,
} = require('../../src/database/migrations/index.ts');
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
    assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
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
    sqlite.exec('PRAGMA user_version = ' + (SCHEMA_VERSION + 1));
    await assert.rejects(migrate(adapter(sqlite)), /더 최신 앱/);
    assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION + 1);
  } finally {
    sqlite.close();
  }
});

test('version 2 upgrade preserves assigned time and removes the startup temporary sort', async () => {
  const { addDailyTime } = require('../../src/database/migrations/index.ts');
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(initialSchema + addDailyTime + 'PRAGMA user_version = 2;');
    sqlite
      .prepare(
        'INSERT INTO daily_plan_items (id, date, content, createdAt, time) VALUES (?, ?, ?, ?, ?)',
      )
      .run('meal', '2026-11-07', '식사', '2026-11-01T00:00:00.000Z', '13:10');
    await migrate(adapter(sqlite));
    assert.equal(sqlite.prepare('SELECT time FROM daily_plan_items').get().time, '13:10');
    const plan = sqlite
      .prepare(
        'EXPLAIN QUERY PLAN SELECT id, date, content, createdAt, time FROM daily_plan_items ORDER BY createdAt, id',
      )
      .all()
      .map((row) => row.detail)
      .join(' ');
    assert.match(plan, /daily_created_order/);
    assert.doesNotMatch(plan, /TEMP B-TREE/);
  } finally {
    sqlite.close();
  }
});

test('version 3 adds important flags without recreating indexes or losing times', async () => {
  const { addDailyTime, addReadIndexes } = require('../../src/database/migrations/index.ts');
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(initialSchema + addDailyTime + addReadIndexes + 'PRAGMA user_version = 3;');
    sqlite
      .prepare('INSERT INTO daily_plan_items (id,date,content,createdAt,time) VALUES (?,?,?,?,?)')
      .run('a', '2026-11-08', '회의', '2026-11-01T00:00:00.000Z', '13:10');
    await migrate(adapter(sqlite));
    const row = sqlite.prepare('SELECT * FROM daily_plan_items').get();
    assert.equal(row.important, 0);
    assert.equal(row.time, '13:10');
    sqlite.prepare('UPDATE daily_plan_items SET important = 1').run();
    await migrate(adapter(sqlite));
    assert.equal(sqlite.prepare('SELECT important FROM daily_plan_items').get().important, 1);
    assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  } finally {
    sqlite.close();
  }
});

test('version 4 adds opt-in alarms without changing existing important schedules', async () => {
  const {
    addDailyTime,
    addReadIndexes,
    addDailyImportance,
  } = require('../../src/database/migrations/index.ts');
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(
      initialSchema +
        addDailyTime +
        addReadIndexes +
        addDailyImportance +
        'PRAGMA user_version = 4;',
    );
    sqlite
      .prepare(
        'INSERT INTO daily_plan_items (id,date,content,createdAt,time,important) VALUES (?,?,?,?,?,?)',
      )
      .run('a', '2026-11-08', '회의', '2026-11-01T00:00:00.000Z', '13:10', 1);
    await migrate(adapter(sqlite));
    const row = sqlite.prepare('SELECT * FROM daily_plan_items').get();
    assert.equal(row.alarm, 0);
    assert.equal(row.important, 1);
    assert.equal(row.time, '13:10');
    sqlite.exec('UPDATE daily_plan_items SET alarm = 1');
    await migrate(adapter(sqlite));
    assert.equal(sqlite.prepare('SELECT alarm FROM daily_plan_items').get().alarm, 1);
  } finally {
    sqlite.close();
  }
});

test('version 5 upgrade preserves schedules and creates a persistent notes table', async () => {
  const {
    addDailyTime,
    addReadIndexes,
    addDailyImportance,
    addDailyAlarm,
  } = require('../../src/database/migrations/index.ts');
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(
      initialSchema +
        addDailyTime +
        addReadIndexes +
        addDailyImportance +
        addDailyAlarm +
        'PRAGMA user_version = 5;',
    );
    sqlite
      .prepare('INSERT INTO daily_plan_items (id,date,content,createdAt) VALUES (?,?,?,?)')
      .run('old', '2026-11-14', '기존 일정', '2026-11-14T00:00:00Z');
    await migrate(adapter(sqlite));
    sqlite
      .prepare('INSERT INTO memos VALUES (?, ?)')
      .run('memo', JSON.stringify({ content: '장기 계획' }));
    await migrate(adapter(sqlite));
    assert.equal(sqlite.prepare('SELECT content FROM daily_plan_items').get().content, '기존 일정');
    assert.equal(
      JSON.parse(sqlite.prepare('SELECT payload FROM memos').get().payload).content,
      '장기 계획',
    );
  } finally {
    sqlite.close();
  }
});
