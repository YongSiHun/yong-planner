require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote, dailyNoteItems } = require('../src/features/planner/services/note.ts');
const {
  copyNotesToDates,
  deleteSelectedNotes,
} = require('../src/features/planner/services/noteSelection.ts');
const { validateData } = require('../src/services/backup/validation.ts');
let sequence = 0;
const id = () => 'item-' + ++sequence;

test('copying to multiple dates adds one new item per distinct destination without replacing existing schedules', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의', id);
  data = applyDailyNote(data, '2026-11-08', '기존 일정', id);
  const source = data.dailyPlanItems.find((item) => item.date === '2026-11-07');
  const copied = copyNotesToDates(
    data,
    new Set([source.id]),
    ['2026-11-08', '2026-12-01', '2026-11-08', source.date],
    id,
  );
  assert.deepEqual(
    dailyNoteItems(copied, '2026-11-08').map((item) => item.content),
    ['기존 일정', '회의'],
  );
  assert.deepEqual(
    dailyNoteItems(copied, '2026-12-01').map((item) => item.content),
    ['회의'],
  );
  assert.equal(dailyNoteItems(copied, source.date).length, 1);
  assert.equal(
    new Set(copied.dailyPlanItems.map((item) => item.id)).size,
    copied.dailyPlanItems.length,
  );
  assert.equal(data.dailyPlanItems.length, 2);
  assert.deepEqual(validateData(copied), copied);
});

test('selected deletion removes only selected IDs and preserves recurrence and other dates', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '동일,동일,보관', id);
  data = applyDailyNote(data, '2026-12-01', '다른 날짜', id);
  const first = data.dailyPlanItems[0];
  data.dailyPlanOrders[0].itemIds.push('recurring:retained');
  const next = deleteSelectedNotes(data, new Set([first.id]));
  assert.deepEqual(
    dailyNoteItems(next, '2026-11-07').map((item) => item.content),
    ['동일', '보관'],
  );
  assert.equal(dailyNoteItems(next, '2026-12-01').length, 1);
  assert.ok(next.dailyPlanOrders[0].itemIds.includes('recurring:retained'));
  assert.ok(!next.dailyPlanOrders[0].itemIds.includes('daily:' + first.id));
  assert.equal(deleteSelectedNotes(next, new Set(['missing'])), next);
});

test('copy validates all destination dates before updating any schedule', () => {
  const data = applyDailyNote(emptyData(), '2026-11-07', '회의', id);
  const source = data.dailyPlanItems[0];
  assert.throws(() =>
    copyNotesToDates(data, new Set([source.id]), ['2026-11-08', '2026-02-30'], id),
  );
  assert.equal(data.dailyPlanItems.length, 1);
  assert.equal(copyNotesToDates(data, new Set(['missing']), ['2026-11-08'], id), data);
});

test('copy appends after every existing chip even when custom order omits items', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '복사 원본', id);
  data = applyDailyNote(data, '2026-12-01', '첫째,둘째,셋째', id);
  const source = data.dailyPlanItems[0];
  const target = dailyNoteItems(data, '2026-12-01');
  data.dailyPlanOrders = [
    { date: '2026-12-01', itemIds: ['daily:' + target[2].id, 'daily:' + target[0].id] },
  ];
  const copied = copyNotesToDates(data, new Set([source.id]), ['2026-12-01'], id);
  assert.deepEqual(
    dailyNoteItems(copied, '2026-12-01').map((item) => item.content),
    ['셋째', '첫째', '둘째', '복사 원본'],
  );
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

test('multi-copy keeps existing content and important flags and excludes each source date', () => {
  const data = seedBatch();
  let id = 0;
  const changed = copyNotesToDates(
    data,
    new Set(['1', '2']),
    ['2026-11-08', '2026-11-09', '2026-11-09'],
    () => 'copy-' + ++id,
  );
  assert.equal(dailyNoteItems(changed, '2026-11-08').length, 3);
  const copied = dailyNoteItems(changed, '2026-11-09');
  assert.deepEqual(
    copied.map((item) => item.content),
    ['기존 일정', '회의', '밥먹기'],
  );
  assert.equal(copied[1].important, true);
  assert.equal(copied[1].time, '13:10');
  assert.equal(
    new Set(changed.dailyPlanItems.map((item) => item.id)).size,
    changed.dailyPlanItems.length,
  );
});
