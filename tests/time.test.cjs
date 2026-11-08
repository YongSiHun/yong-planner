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
  assert.deepEqual(
    parseBackup(createBackup(data)),
    require('../src/services/backup/validation.ts').validateData(data),
  );
});

test('leading Korean and colon times become structured times without duplicating the prefix', () => {
  const { parseScheduleTimePrefix } = require('../src/features/planner/services/time.ts');
  for (const text of ['13시 10분 회의', '13:10 회의', '13시10분 회의']) {
    assert.deepEqual(parseScheduleTimePrefix(text), { time: '13:10', content: '회의' });
    const data = applyDailyNote(emptyData(), '2026-11-07', text, () => 'meeting');
    assert.equal(data.dailyPlanItems[0].time, '13:10');
    assert.equal(data.dailyPlanItems[0].content, '회의');
    assert.equal(
      formatScheduleContent(data.dailyPlanItems[0].content, data.dailyPlanItems[0].time, '12h'),
      '오후 1시 10분 회의',
    );
    assert.equal(
      applyDailyNote(data, '2026-11-07', text, () => 'new'),
      data,
    );
  }
  assert.deepEqual(parseScheduleTimePrefix('0시 아침'), { time: '00:00', content: '아침' });
  for (const text of [
    '24:10 회의',
    '13:60 회의',
    '회의 13:10',
    '13시 99분 회의',
    '13:10 ',
    '13시 10분까지 회의',
  ]) {
    assert.deepEqual(parseScheduleTimePrefix(text), { content: text });
  }
});

test('comma-separated time input preserves IDs, overrides time, and survives restore and copy', () => {
  let id = 0;
  const nextId = () => String(++id);
  const date = '2026-11-07';
  let data = applyDailyNote(emptyData(), date, '13:10 회의,18시 운동', nextId);
  const ids = dailyNoteItems(data, date).map((item) => item.id);
  data = applyDailyNote(data, date, '14시 20분 회의,18시 운동', nextId);
  assert.deepEqual(
    dailyNoteItems(data, date).map((item) => item.id),
    ids,
  );
  assert.deepEqual(
    dailyNoteItems(data, date).map((item) => item.time),
    ['14:20', '18:00'],
  );
  data = applyDailyNote(data, date, '회의 내용 수정,운동', nextId);
  assert.equal(dailyNoteItems(data, date)[0].time, '14:20');
  data = parseBackup(createBackup(data));
  data = copyNoteToDates(data, ids[0], ['2026-11-08'], nextId);
  assert.equal(dailyNoteItems(data, '2026-11-08')[0].time, '14:20');
});

test('inline time deletion clears the stored time and alarm without touching other chips', () => {
  const { noteEditText } = require('../src/features/planner/services/note.ts');
  let id = 0;
  const nextId = () => 'time-' + ++id;
  const date = '2026-11-08';
  let data = applyDailyNote(emptyData(), date, '회의,운동', nextId);
  data.dailyPlanItems[0] = {
    ...data.dailyPlanItems[0],
    time: '13:10',
    alarm: true,
    important: true,
  };
  data.dailyPlanItems[1].time = '18:00';
  const originalIds = data.dailyPlanItems.map((item) => item.id);
  assert.equal(noteEditText('회의,운동', ['13:10', '18:00']), '13:10 회의,18:00 운동');
  data = applyDailyNote(data, date, '회의,18:00 운동', nextId, true);
  assert.deepEqual(
    data.dailyPlanItems.map((item) => item.id),
    originalIds,
  );
  assert.equal(data.dailyPlanItems[0].time, null);
  assert.equal(data.dailyPlanItems[0].alarm, undefined);
  assert.equal(data.dailyPlanItems[0].important, true);
  assert.equal(data.dailyPlanItems[1].time, '18:00');
  data = applyDailyNote(data, date, '14:20 회의,18:00 운동', nextId, true);
  assert.equal(data.dailyPlanItems[0].time, '14:20');
  assert.deepEqual(
    parseBackup(createBackup(data)),
    require('../src/services/backup/validation.ts').validateData(data),
  );
});
