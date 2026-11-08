require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const {
  initialSchema,
  addDailyTime,
  addDailyImportance,
} = require('../src/database/migrations/index.ts');
const { replaceRows } = require('../src/database/repositories/transactions.ts');
const { emptyData } = require('../src/features/planner/types/index.ts');
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON;' + initialSchema + addDailyTime + addDailyImportance);
const statements = [];
let failNextWrite = false;
const database = {
  async execAsync(sql) {
    sqlite.exec(sql);
  },
  async runAsync(sql, ...params) {
    if (failNextWrite) {
      failNextWrite = false;
      throw new Error('write failed');
    }
    statements.push(sql);
    return sqlite.prepare(sql).run(...params);
  },
  async withTransactionAsync(task) {
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
// 실제 SQLite + Expo 연결 mock.
const repositoryPath = require.resolve('../src/database/repositories/planner.ts');
require.cache[repositoryPath] = {
  id: repositoryPath,
  filename: repositoryPath,
  loaded: true,
  exports: {
    getDatabase: async () => database,
    loadData: async () => emptyData(),
    replaceData: (data) => database.withTransactionAsync(() => replaceRows(database, data)),
  },
};
const { persistData, restoreData } = require('../src/database/repositories/persist.ts');
const plan = {
  id: 'repeat',
  title: '일정',
  time: null,
  startDate: '2026-11-01',
  endDate: null,
  weekdays: [1],
  holidayPolicy: 'include',
};
const exception = { recurringPlanId: plan.id, date: '2026-11-09', cancelled: true };

async function seed() {
  const data = { ...emptyData(), recurringPlans: [plan], recurringPlanExceptions: [exception] };
  await restoreData(data);
  statements.length = 0;
  return data;
}

test('exception deletion runs once and unchanged settings are not rewritten', async () => {
  const data = await seed();
  await persistData({ ...data, recurringPlanExceptions: [] });
  assert.equal(
    statements.filter((sql) => sql.startsWith('DELETE FROM recurring_plan_exceptions')).length,
    1,
  );
  assert.equal(statements.filter((sql) => sql.startsWith('INSERT INTO settings')).length, 0);
  assert.equal(
    sqlite.prepare('SELECT count(*) AS count FROM recurring_plan_exceptions').get().count,
    0,
  );
});

test('parent deletion cascades correctly and changed settings are saved', async () => {
  const data = await seed();
  await persistData({
    ...data,
    recurringPlans: [],
    recurringPlanExceptions: [],
    settings: { theme: 'dark' },
  });
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM recurring_plans').get().count, 0);
  assert.equal(
    sqlite.prepare('SELECT count(*) AS count FROM recurring_plan_exceptions').get().count,
    0,
  );
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT payload FROM settings').get().payload), {
    theme: 'dark',
  });
});

test('failed transaction rolls back and the same change can be retried', async () => {
  const data = await seed();
  const next = {
    ...data,
    recurringPlans: [{ ...plan, title: '수정' }],
    recurringPlanExceptions: [],
  };
  failNextWrite = true;
  await assert.rejects(persistData(next), /write failed/);
  assert.equal(
    JSON.parse(sqlite.prepare('SELECT payload FROM recurring_plans').get().payload).title,
    '일정',
  );
  assert.equal(
    sqlite.prepare('SELECT count(*) AS count FROM recurring_plan_exceptions').get().count,
    1,
  );
  await persistData(next);
  assert.equal(
    JSON.parse(sqlite.prepare('SELECT payload FROM recurring_plans').get().payload).title,
    '수정',
  );
  assert.equal(
    sqlite.prepare('SELECT count(*) AS count FROM recurring_plan_exceptions').get().count,
    0,
  );
});

test('daily time and format-only settings changes persist in SQLite', async () => {
  const data = await seed();
  const next = {
    ...data,
    dailyPlanItems: [
      {
        id: 'meal',
        date: '2026-11-07',
        content: '식사',
        createdAt: '2026-11-01T00:00:00.000Z',
        time: '13:00',
      },
    ],
    settings: { ...data.settings, timeFormat: '12h' },
  };
  await persistData(next);
  assert.equal(
    sqlite.prepare('SELECT time FROM daily_plan_items WHERE id = ?').get('meal').time,
    '13:00',
  );
  assert.equal(
    JSON.parse(sqlite.prepare('SELECT payload FROM settings').get().payload).timeFormat,
    '12h',
  );
});

test('important flags persist and can be cleared in SQLite', async () => {
  const data = await seed();
  const item = {
    id: 'star',
    date: '2026-11-08',
    content: '중요 일정',
    createdAt: '2026-11-01T00:00:00.000Z',
    important: true,
  };
  await persistData({ ...data, dailyPlanItems: [item] });
  assert.equal(
    sqlite.prepare('SELECT important FROM daily_plan_items WHERE id = ?').get('star').important,
    1,
  );
  await persistData({ ...data, dailyPlanItems: [{ ...item, important: false }] });
  assert.equal(
    sqlite.prepare('SELECT important FROM daily_plan_items WHERE id = ?').get('star').important,
    0,
  );
});
