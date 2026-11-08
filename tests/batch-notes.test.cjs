require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote, dailyNoteItems } = require('../src/features/planner/services/note.ts');
const { copyNotesToDates } = require('../src/features/planner/services/noteSelection.ts');
const { editDailyContents } = require('../src/features/planner/services/noteEditing.ts');
const { createBackup, parseBackup } = require('../src/services/backup/index.ts');
const { boundedClockInput } = require('../src/features/planner/services/time.ts');

function seed() {
  let id = 0;
  let data = applyDailyNote(emptyData(), '2026-11-08', '13:10 회의,밥먹기,운동', () =>
    String(++id),
  );
  data.dailyPlanItems[0].important = true;
  data = applyDailyNote(data, '2026-11-09', '기존 일정', () => String(++id));

  return data;
}

test('batch edits retain IDs, important flags, times and unaffected schedules', () => {
  const data = seed();
  const changed = editDailyContents(
    data,
    new Map([
      ['1', '중요 회의'],
      ['2', '18:30 저녁'],
    ]),
    () => 'new',
  );
  const items = dailyNoteItems(changed, '2026-11-08');
  assert.equal(items[0].content, '중요 회의');
  assert.equal(items[0].time, '13:10');
  assert.equal(items[0].important, true);
  assert.equal(items[1].content, '저녁');
  assert.equal(items[1].time, '18:30');
  assert.equal(items[2], dailyNoteItems(data, '2026-11-08')[2]);
  assert.equal(dailyNoteItems(changed, '2026-11-09')[0], dailyNoteItems(data, '2026-11-09')[0]);
  assert.equal(
    editDailyContents(data, new Map([['1', '회의']]), () => 'new'),
    data,
  );
});

test('batch edit splits comma input in place and rejects oversized contents atomically', () => {
  const data = seed();
  const changed = editDailyContents(data, new Map([['2', '장보기,요리']]), () => 'split');
  assert.deepEqual(
    dailyNoteItems(changed, '2026-11-08').map((item) => item.content),
    ['회의', '장보기', '요리', '운동'],
  );
  assert.throws(
    () =>
      editDailyContents(
        data,
        new Map([
          ['1', '수정'],
          ['2', '가'.repeat(256)],
        ]),
        () => 'new',
      ),
    /255자/,
  );
  assert.equal(dailyNoteItems(data, '2026-11-08')[0].content, '회의');
});

test('multi-copy keeps existing content and important flags and excludes each source date', () => {
  const data = seed();
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

test('important schedules survive backup round trips and old backups remain compatible', () => {
  const data = seed();
  const backup = createBackup(data);
  assert.equal(JSON.parse(backup).version, 4);
  assert.equal(parseBackup(backup).dailyPlanItems[0].important, true);
  for (const version of [1, 2, 3]) {
    const legacy = { ...emptyData(), version, exportedAt: new Date().toISOString() };
    assert.deepEqual(parseBackup(JSON.stringify(legacy)), emptyData());
  }
  const malformed = JSON.parse(backup);
  malformed.dailyPlanItems[0].important = 'true';
  assert.throws(() => parseBackup(JSON.stringify(malformed)), /중요 일정/);
});

test('hour and minute input clamps to supported ranges without allowing decimals or letters', () => {
  assert.equal(boundedClockInput('0', '9', 1, 12), '1');
  assert.equal(boundedClockInput('13', '9', 1, 12), '12');
  assert.equal(boundedClockInput('0', '9', 0, 23), '0');
  assert.equal(boundedClockInput('13', '9', 0, 23), '13');
  assert.equal(boundedClockInput('26', '9', 0, 23), '23');
  assert.equal(boundedClockInput('-1', '9', 0, 23), '0');
  assert.equal(boundedClockInput('60', '00', 0, 59), '59');
  assert.equal(boundedClockInput('99999', '00', 0, 59), '59');
  assert.equal(boundedClockInput('', '9', 1, 12), '');
  assert.equal(boundedClockInput('1.5', '9', 1, 12), '9');
  assert.equal(boundedClockInput('abc', '9', 1, 12), '9');
});

test('chip alarm metadata survives backup and rejects malformed flags', () => {
  const data = seed();
  data.dailyPlanItems[0].alarm = true;
  const backup = createBackup(data);
  assert.equal(parseBackup(backup).dailyPlanItems[0].alarm, true);
  const malformed = JSON.parse(backup);
  malformed.dailyPlanItems[0].alarm = 'true';
  assert.throws(() => parseBackup(JSON.stringify(malformed)), /알람 값/);
});
