require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  formatScheduleContent,
  formatScheduleTime,
  timeFromFields,
} = require('../src/features/planner/services/time.ts');
const { applyDailyNote, dailyNoteItems } = require('../src/features/planner/services/note.ts');
const { copyNoteToDates } = require('../src/features/planner/services/noteSelection.ts');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { createBackup, parseBackup } = require('../src/services/backup/index.ts');
test('time format changes display while preserving canonical time', () => {
  assert.equal(formatScheduleContent('밥먹기', '13:00', '24h'), '13시 밥먹기');
  assert.equal(formatScheduleContent('밥먹기', '13:00', '12h'), '오후 1시 밥먹기');
  assert.equal(formatScheduleTime('00:30', '12h'), '오전 12시 30분');
  assert.equal(formatScheduleTime('12:00', '12h'), '오후 12시');
  assert.equal(timeFromFields('12', '00', 'am', '12h'), '00:00');
  assert.equal(timeFromFields('1', '30', 'pm', '12h'), '13:30');
  assert.equal(timeFromFields('24', '00', 'am', '24h'), null);
  assert.equal(timeFromFields('1', '60', 'am', '24h'), null);
});
test('inserting and deleting schedules keeps times attached to existing IDs', () => {
  const date = '2026-11-07';
  let id = 0;
  const nextId = () => 'item-' + ++id;
  let data = applyDailyNote(emptyData(), date, '회의,식사', nextId);
  data.dailyPlanItems[1].time = '13:00';
  const timedId = data.dailyPlanItems[1].id;
  data = applyDailyNote(data, date, '회의,장보기,식사', nextId);
  assert.equal(dailyNoteItems(data, date)[2].id, timedId);
  assert.equal(dailyNoteItems(data, date)[2].time, '13:00');
  data = applyDailyNote(data, date, '장보기,식사', nextId);
  assert.equal(dailyNoteItems(data, date)[1].id, timedId);
  const copied = copyNoteToDates(data, timedId, ['2026-11-08'], nextId);
  assert.equal(dailyNoteItems(copied, '2026-11-08')[0].time, '13:00');
});
test('new backups retain times and legacy backups remain readable', () => {
  const legacy = emptyData();
  assert.deepEqual(
    parseBackup(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...legacy })),
    legacy,
  );
  let data = applyDailyNote(legacy, '2026-11-07', '식사', () => 'meal');
  data.dailyPlanItems[0].time = '13:00';
  data.settings.timeFormat = '12h';
  assert.deepEqual(parseBackup(createBackup(data)), data);
});
