require('../support/register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote, dailyNoteItems } = require('../../src/features/planner/services/note.ts');
const {
  copyNotesToDates,
  deleteSelectedNotes,
} = require('../../src/features/planner/services/noteSelection.ts');
const { validateData } = require('../../src/services/backup/validation.ts');
let sequence = 0;
const id = () => 'item-' + ++sequence;

test('copying to multiple dates adds one new item per distinct destination without replacing existing schedules', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의', id);
  data = applyDailyNote(data, '2026-11-08', '기존 일정', id);
  const source = data.dailyPlanItems.find((item) => item.date === '2026-11-07');
  const copied = copyNotesToDates(
    data,
    new Set([source.id]),
    ['2026-11-08', '2026-12-01', '2026-11-08'],
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

test('single copy keeps existing content, important flags and times', () => {
  const data = seedBatch();
  let id = 0;
  const changed = copyNotesToDates(
    data,
    new Set(['1']),
    ['2026-11-09', '2026-11-09'],
    () => 'copy-' + ++id,
  );
  assert.equal(dailyNoteItems(changed, '2026-11-08').length, 3);
  const copied = dailyNoteItems(changed, '2026-11-09');
  assert.deepEqual(
    copied.map((item) => item.content),
    ['기존 일정', '회의'],
  );
  assert.equal(copied[1].important, true);
  assert.equal(copied[1].time, '13:10');
  assert.equal(
    new Set(changed.dailyPlanItems.map((item) => item.id)).size,
    changed.dailyPlanItems.length,
  );
});

test('copy rejects original and previously copied dates regardless of flags or surrounding whitespace', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의', id);
  const source = data.dailyPlanItems[0];
  data = copyNotesToDates(data, new Set([source.id]), ['2026-11-08'], id);
  data.dailyPlanItems[1] = {
    ...data.dailyPlanItems[1],
    content: ' 회의 ',
    important: true,
    alarm: true,
  };
  for (const date of ['2026-11-07', '2026-11-08']) {
    assert.throws(() => copyNotesToDates(data, new Set([source.id]), [date], id), /이미 같은 일정/);
  }
  assert.equal(data.dailyPlanItems.length, 2);
});

test('same content at a different time can be copied and conflicting targets are atomic', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '13:00 회의,운동', id);
  const sources = new Set([data.dailyPlanItems[0].id]);
  data = applyDailyNote(data, '2026-11-08', '14:00 회의', id);
  const copied = copyNotesToDates(data, sources, ['2026-11-08'], id);
  assert.equal(dailyNoteItems(copied, '2026-11-08').length, 2);
  data = applyDailyNote(data, '2026-11-09', '13:00 회의', id);
  let created = 0;
  assert.throws(
    () => copyNotesToDates(data, sources, ['2026-11-10', '2026-11-09'], () => String(++created)),
    /이미 같은 일정/,
  );
  assert.equal(created, 0);
  assert.equal(dailyNoteItems(data, '2026-11-10').length, 0);
});

test('visible recurring schedules block duplicates while cancelled occurrences allow copying', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '13:00 회의', id);
  const ids = new Set([data.dailyPlanItems[0].id]);
  data = {
    ...data,
    recurringPlans: [
      {
        id: 'repeat',
        title: '회의',
        time: '13:00',
        startDate: '2026-11-08',
        endDate: null,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        holidayPolicy: 'include',
      },
    ],
  };
  assert.throws(() => copyNotesToDates(data, ids, ['2026-11-08'], id), /이미 같은 일정/);
  data = {
    ...data,
    recurringPlanExceptions: [{ recurringPlanId: 'repeat', date: '2026-11-08', cancelled: true }],
  };
  assert.equal(
    dailyNoteItems(copyNotesToDates(data, ids, ['2026-11-08'], id), '2026-11-08').length,
    1,
  );
});

test('multiple sources are rejected before creating copies', () => {
  const data = applyDailyNote(emptyData(), '2026-11-07', '회의,운동', id);
  const ids = new Set(data.dailyPlanItems.map((item) => item.id));
  let created = 0;
  assert.throws(
    () => copyNotesToDates(data, ids, ['2026-11-09'], () => String(++created)),
    /일정 복사는 하나만 가능해요/,
  );
  assert.equal(created, 0);
  assert.equal(data.dailyPlanItems.length, 2);
});
