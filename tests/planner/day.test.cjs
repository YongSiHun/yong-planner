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

const {
  selectedDailyItems,
  createSelectedDateIndex,
} = require('../../src/features/planner/services/selectionProjection.ts');

test('selection projection invalidates only changed dates, including the final deselection', () => {
  const items = Array.from({ length: 31 }, (_, i) => ({
    id: 'item-' + i,
    date: '2026-12-' + String(i + 1).padStart(2, '0'),
    content: '일정',
    createdAt: '2026-12-01T00:00:00Z',
  }));
  const project = createSelectedDateIndex();
  const emptyIds = new Set();
  const snapshots = [[], ['item-0'], ['item-0', 'item-1'], ['item-1'], []].map((ids) =>
    project(selectedDailyItems(items, new Set(ids))),
  );
  const invalidated = snapshots
    .slice(1)
    .map((after, step) =>
      items
        .filter(
          (item) =>
            (snapshots[step].get(item.date) ?? emptyIds) !== (after.get(item.date) ?? emptyIds),
        )
        .map((item) => item.date),
    );
  assert.deepEqual(invalidated, [['2026-12-01'], ['2026-12-02'], ['2026-12-01'], ['2026-12-02']]);
  const reverse = selectedDailyItems(items, new Set(['item-10', 'item-0', 'missing']));
  assert.deepEqual(
    reverse.map((item) => item.id),
    ['item-0', 'item-10'],
  );
  const changed = items.map((item) => (item.id === 'item-0' ? { ...item, content: '수정' } : item));
  assert.equal(selectedDailyItems(changed, new Set(['item-0']))[0].content, '수정');
});

test('ordered daily note cache is reused for unrelated changes and invalidated by reorder or content edits', () => {
  const { dailyNoteItems } = require('../../src/features/planner/services/note.ts');
  const { moveDailyNote } = require('../../src/features/planner/services/noteMove.ts');
  let id = 0;
  let data = applyDailyNote(emptyData(), '2026-11-07', '회의,운동', () => String(++id));
  const first = dailyNoteItems(data, '2026-11-07');
  assert.equal(dailyNoteItems({ ...data, settings: { theme: 'dark' } }, '2026-11-07'), first);
  data = applyDailyNote(data, '2026-11-08', '다른 날', () => String(++id));
  assert.equal(dailyNoteItems(data, '2026-11-07'), first);
  const moved = moveDailyNote(data, '2026-11-07', 0, 2);
  assert.deepEqual(
    dailyNoteItems(moved, '2026-11-07').map((item) => item.content),
    ['운동', '회의'],
  );
  assert.deepEqual(
    dailyNoteItems(data, '2026-11-07').map((item) => item.content),
    ['회의', '운동'],
  );
  const edited = applyDailyNote(data, '2026-11-07', '수정,운동', () => String(++id));
  assert.equal(dailyNoteItems(edited, '2026-11-07')[0].content, '수정');
});
