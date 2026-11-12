require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
const { createDaySelector } = require('../../src/features/planner/services/day.ts');
const holidays = { isHoliday: () => false, getHolidayName: () => null };
test('typing changes only the edited day read model and reuses all other day models', () => {
  let id = 0;
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의', () => String(++id));
  data = applyDailyNote(data, '2026-11-08', '운동', () => String(++id));
  const edited = createDaySelector('2026-11-07', holidays);
  const other = createDaySelector('2026-11-08', holidays);
  const empty = createDaySelector('2026-11-09', holidays);
  const before = edited(data);
  const otherBefore = other(data);
  const emptyBefore = empty(data);
  for (const text of ['회의 내용', '회의 내용 수정', '회의 내용 수정\n두 번째 줄']) {
    data = applyDailyNote(data, '2026-11-07', text, () => String(++id));
    assert.notEqual(edited(data), before);
    assert.equal(other(data), otherBefore);
    assert.equal(empty(data), emptyBefore);
    assert.equal(edited(data).note, text);
  }
  assert.equal(other({ ...data, settings: { ...data.settings, timeFormat: '12h' } }), otherBefore);
});
test('day model updates when time, recurrence or holiday service changes', () => {
  let data = applyDailyNote(emptyData(), '2026-11-07', '식사', () => 'meal');
  const select = createDaySelector('2026-11-07', holidays);
  const before = select(data);
  data = {
    ...data,
    dailyPlanItems: data.dailyPlanItems.map((item) => ({ ...item, time: '13:10' })),
  };
  assert.notEqual(select(data), before);
  assert.deepEqual(select(data).noteTimes, ['13:10']);
  const named = createDaySelector('2026-11-07', { ...holidays, getHolidayName: () => '기념일' });
  assert.equal(named(data).holidayName, '기념일');
});
