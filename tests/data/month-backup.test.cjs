require('../support/register.cjs');
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { test } = require('node:test');
const {
  createBackup,
  parseBackup,
  mergeMonthBackup,
  MAX_BACKUP_BYTES,
} = require('../../src/services/backup/index.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
const { plansForDate } = require('../../src/features/planner/services/plans.ts');
const { createHolidayService } = require('../../src/services/holiday/index.ts');
const item = (id, date) => ({
  id,
  date,
  content: id,
  time: '13:00',
  important: true,
  alarm: true,
  createdAt: '2026-01-01T00:00:00.000Z',
});
function fixture() {
  return {
    ...emptyData(),
    dailyPlanItems: [
      item('oct', '2026-10-31'),
      item('nov', '2026-11-09'),
      item('dec', '2026-12-01'),
    ],
    recurringPlans: [
      {
        id: 'repeat',
        title: '반복',
        startDate: '2026-01-01',
        endDate: null,
        time: '09:00',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        holidayPolicy: 'include',
      },
    ],
    recurringPlanExceptions: [
      { recurringPlanId: 'repeat', date: '2026-11-10', cancelled: true },
      {
        recurringPlanId: 'repeat',
        date: '2026-12-01',
        cancelled: false,
        title: '수정한 반복',
        time: '15:00',
      },
    ],
    dailyPlanOrders: [
      { date: '2026-11-09', itemIds: ['recurring:repeat', 'daily:nov'] },
      { date: '2026-12-01', itemIds: ['recurring:repeat', 'daily:dec'] },
    ],
    holidayOverrides: [
      { date: '2026-11-09', name: '휴일' },
      { date: '2026-12-01', name: null },
    ],
  };
}
const visible = (data, date) =>
  plansForDate(data, date, createHolidayService(data.holidayOverrides)).map(
    ({ content, time, important, alarm, kind }) => ({ content, time, important, alarm, kind }),
  );

test('monthly JSON includes only the chosen month and clips recurring rules', () => {
  const source = fixture();
  const backup = parseBackup(createBackup(source, '2026-11-09'));
  assert.equal(backup.month, '2026-11');
  assert.equal(JSON.parse(createBackup(source, '2026-11-09')).version, 5);
  assert.deepEqual(backup.dailyPlanItems, [source.dailyPlanItems[1]]);
  assert.equal(backup.recurringPlans[0].startDate, '2026-11-01');
  assert.equal(backup.recurringPlans[0].endDate, '2026-11-30');
  assert.equal(backup.recurringPlanExceptions.length, 1);
  assert.equal(backup.dailyPlanOrders.length, 1);
  assert.equal(backup.holidayOverrides.length, 1);
});

test('monthly restoration replaces one month and preserves other months, exceptions and order', () => {
  const source = fixture();
  const backup = parseBackup(createBackup(source, '2026-11-09'));
  const current = fixture();
  current.settings = { theme: 'dark', timeFormat: '12h' };
  current.dailyPlanItems[1].content = '置換';
  current.dailyPlanItems.push(item('extra', '2026-11-12'));
  const restored = mergeMonthBackup(current, backup);
  assert.deepEqual(restored.settings, current.settings);
  for (const date of ['2026-01-01', '2026-10-31', '2026-12-01', '2027-01-01']) {
    assert.deepEqual(visible(restored, date), visible(current, date), date);
  }
  for (const date of ['2026-11-01', '2026-11-09', '2026-11-10', '2026-11-12', '2026-11-30']) {
    assert.deepEqual(visible(restored, date), visible(source, date), date);
  }
  const again = mergeMonthBackup(restored, backup);
  assert.deepEqual(visible(again, '2026-11-09'), visible(restored, '2026-11-09'));
  assert.equal(again.dailyPlanItems.length, restored.dailyPlanItems.length);
  assert.equal(again.recurringPlans.length, restored.recurringPlans.length);
});

test('empty monthly backup clears only that month', () => {
  const source = fixture();
  const restored = mergeMonthBackup(source, parseBackup(createBackup(emptyData(), '2026-11-01')));
  assert.deepEqual(visible(restored, '2026-11-09'), []);
  assert.deepEqual(visible(restored, '2026-12-01'), visible(source, '2026-12-01'));
});

test('whole-data backups remain compatible and invalid monthly metadata is rejected', () => {
  const data = fixture();
  assert.deepEqual(parseBackup(createBackup(data)), data);
  const raw = JSON.parse(createBackup(data, '2026-11-01'));
  for (const month of [undefined, '2026-13', '2026-1', 11]) {
    assert.throws(() => parseBackup(JSON.stringify({ ...raw, month })));
  }
});

test('removing a month-scoped recurring rule also removes its stale out-of-range exceptions', () => {
  const current = fixture();
  current.recurringPlans[0].startDate = '2026-11-01';
  current.recurringPlans[0].endDate = '2026-11-30';
  const restored = mergeMonthBackup(current, parseBackup(createBackup(emptyData(), '2026-11-01')));
  assert.deepEqual(restored.recurringPlans, []);
  assert.deepEqual(restored.recurringPlanExceptions, []);
  assert.equal(restored.dailyPlanItems.length, 2);
});

test('leap-month restoration preserves recurring schedules on both adjacent dates', () => {
  const current = fixture();
  current.recurringPlans[0].startDate = '2024-01-01';
  const restored = mergeMonthBackup(current, parseBackup(createBackup(emptyData(), '2024-02-01')));
  assert.deepEqual(visible(restored, '2024-02-29'), []);
  for (const date of ['2024-01-31', '2024-03-01']) {
    assert.deepEqual(visible(restored, date), visible(current, date));
  }
});

function seedBatch() {
  let id = 0;
  let data = applyDailyNote(emptyData(), '2026-11-08', '13:10 회의,밥먹기,운동', () =>
    String(++id),
  );
  data.dailyPlanItems[0].important = true;
  data = applyDailyNote(data, '2026-11-09', '기존 일정', () => String(++id));

  return data;
}

test('important schedules survive backup round trips and old backups remain compatible', () => {
  const data = seedBatch();
  const backup = createBackup(data);
  assert.equal(JSON.parse(backup).version, 6);
  assert.equal(parseBackup(backup).dailyPlanItems[0].important, true);
  for (const version of [1, 2, 3]) {
    const legacy = { ...emptyData(), version, exportedAt: new Date().toISOString() };
    assert.deepEqual(parseBackup(JSON.stringify(legacy)), emptyData());
  }
  const malformed = JSON.parse(backup);
  malformed.dailyPlanItems[0].important = 'true';
  assert.throws(() => parseBackup(JSON.stringify(malformed)), /중요 일정/);
});

test('chip alarm metadata survives backup and rejects malformed flags', () => {
  const data = seedBatch();
  data.dailyPlanItems[0].alarm = true;
  const backup = createBackup(data);
  assert.equal(parseBackup(backup).dailyPlanItems[0].alarm, true);
  const malformed = JSON.parse(backup);
  malformed.dailyPlanItems[0].alarm = 'true';
  assert.throws(() => parseBackup(JSON.stringify(malformed)), /알람 값/);
});
test('backup size limit counts UTF-8 bytes even when Korean text is below the character limit', () => {
  const base = createBackup(emptyData());
  const padding = '가'.repeat(Math.floor(MAX_BACKUP_BYTES / 3) + 1);
  const json = base.slice(0, -1) + ',"padding":"' + padding + '"}';
  assert.ok(json.length < MAX_BACKUP_BYTES);
  assert.throws(() => parseBackup(json), /50MB/);
});

test('UTF-8 limits handle ASCII, Korean, emoji and isolated surrogate characters at byte boundaries', () => {
  const { fitsUtf8Limit } = require('../../src/utils/utf8.ts');
  for (const text of ['', 'backup', '한글', '🐉', '\ud800', '\udc00', '가🐉a']) {
    const bytes = Buffer.byteLength(text, 'utf8');
    assert.equal(fitsUtf8Limit(text, bytes), true);
    if (bytes > 0) assert.equal(fitsUtf8Limit(text, bytes - 1), false);
  }
});
