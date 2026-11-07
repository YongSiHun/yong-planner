require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote, dailyNoteItems } = require('../src/features/planner/services/note.ts');
const {
  copyNoteToDates,
  deleteSelectedNotes,
} = require('../src/features/planner/services/noteSelection.ts');
const { validateData } = require('../src/services/backup/validation.ts');
let sequence = 0;
const id = () => 'item-' + ++sequence;

test('copying to multiple dates adds one new item per distinct destination without replacing existing schedules', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의', id);
  data = applyDailyNote(data, '2026-11-08', '기존 일정', id);
  const source = data.dailyPlanItems.find((item) => item.date === '2026-11-07');
  const copied = copyNoteToDates(
    data,
    source.id,
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
  assert.throws(() => copyNoteToDates(data, source.id, ['2026-11-08', '2026-02-30'], id));
  assert.equal(data.dailyPlanItems.length, 1);
  assert.equal(copyNoteToDates(data, 'missing', ['2026-11-08'], id), data);
});
