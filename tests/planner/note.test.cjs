const { assert, test } = require('../support/test.cjs');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const {
  applyDailyNote,
  dailyNoteItems,
  splitNote,
  NOTE_SEPARATOR,
} = require('../../src/features/planner/services/note.ts');
const { validateData } = require('../../src/services/backup/validation.ts');
const date = '2026-11-07';
let sequence = 0;
const createId = () => 'note-' + ++sequence;
const read = (data) => dailyNoteItems(data, date).map((item) => item.content);

test('typing a separator splits items; deleting it merges items without losing text', () => {
  let data = applyDailyNote(emptyData(), date, '회의', createId);
  const originalId = data.dailyPlanItems[0].id;
  data = applyDailyNote(data, date, '회의,장보기', createId);
  assert.deepEqual(read(data), ['회의', '장보기']);
  assert.equal(data.dailyPlanItems[0].id, originalId);
  assert.notEqual(data.dailyPlanItems[1].id, originalId);
  data = applyDailyNote(data, date, '회의장보기', createId);
  assert.deepEqual(read(data), ['회의장보기']);
  assert.equal(data.dailyPlanItems[0].id, originalId);
  assert.deepEqual(validateData(data), data);
});

test('spaces, line breaks, consecutive and trailing separators survive a round trip', () => {
  for (const text of [
    '한글 입력 중',
    '회의, 장보기,',
    ',첫 메모,,끝,',
    '첫 줄\n둘째 줄, 다음 일정',
    ' , ',
  ]) {
    const data = applyDailyNote(emptyData(), date, text, createId);
    assert.equal(read(data).join(NOTE_SEPARATOR), text);
    assert.deepEqual(read(data), splitNote(text));
  }
  assert.deepEqual(splitNote(''), []);
});

test('clearing a note removes its items and stale order IDs while preserving other dates and recurrence', () => {
  let data = applyDailyNote(emptyData(), date, '하나,둘', createId);
  data = applyDailyNote(data, '2026-11-08', '다른 날짜', createId);
  const ids = data.dailyPlanItems
    .filter((item) => item.date === date)
    .map((item) => 'daily:' + item.id);
  data = { ...data, dailyPlanOrders: [{ date, itemIds: [ids[1], 'recurring:hidden', ids[0]] }] };
  assert.deepEqual(read(data), ['둘', '하나']);
  const otherDate = data.dailyPlanItems.find((item) => item.date !== date);
  data = applyDailyNote(data, date, '', createId);
  assert.deepEqual(read(data), []);
  assert.deepEqual(data.dailyPlanItems, [otherDate]);
  assert.deepEqual(data.dailyPlanOrders[0].itemIds, ['recurring:hidden']);
});

test('an unchanged note creates no state revision, and restored notes remain editable', () => {
  const data = applyDailyNote(emptyData(), date, '메모,다음', createId);
  assert.equal(applyDailyNote(data, date, '메모,다음', createId), data);
  const restored = validateData(JSON.parse(JSON.stringify(data)));
  const edited = applyDailyNote(restored, date, '메모다음', createId);
  assert.deepEqual(read(edited), ['메모다음']);
});

test('splitting and merging retain typed order after a custom daily sort', () => {
  let data = applyDailyNote(emptyData(), date, '하나,둘', createId);
  const ids = data.dailyPlanItems.map((item) => 'daily:' + item.id);
  data = {
    ...data,
    dailyPlanOrders: [{ date, itemIds: ['recurring:before', ids[1], 'recurring:hidden', ids[0]] }],
  };
  assert.deepEqual(read(data), ['둘', '하나']);
  data = applyDailyNote(data, date, '둘,중간,하나', createId);
  assert.deepEqual(read(data), ['둘', '중간', '하나']);
  assert.equal(data.dailyPlanOrders[0].itemIds[0], 'recurring:before');
  assert.ok(data.dailyPlanOrders[0].itemIds.includes('recurring:hidden'));
  data = applyDailyNote(data, date, '둘중간,하나', createId);
  assert.deepEqual(read(data), ['둘중간', '하나']);
});

test('finishing input removes edge spaces and empty chips while preserving IDs, metadata and word spaces', () => {
  const { finalizeDailyNote } = require('../../src/features/planner/services/noteItems.ts');
  let data = applyDailyNote(emptyData(), date, ' 회의  내용  , ,운동,,', createId);
  data = applyDailyNote(data, '2026-11-08', ' 다른 날짜 ', createId);
  const original = dailyNoteItems(data, date);
  const meeting = { ...original[0], time: '13:10', important: true, alarm: true };
  data = {
    ...data,
    dailyPlanItems: data.dailyPlanItems.map((item) => (item.id === meeting.id ? meeting : item)),
  };
  const order = data.dailyPlanOrders.find((item) => item.date === date);
  data = {
    ...data,
    dailyPlanOrders: data.dailyPlanOrders.map((item) =>
      item === order ? { ...item, itemIds: ['recurring:keep', ...item.itemIds] } : item,
    ),
  };
  const other = data.dailyPlanItems.find((item) => item.date !== date);
  const committed = finalizeDailyNote(data, date);
  assert.deepEqual(read(committed), ['회의  내용', '운동']);
  const actual = dailyNoteItems(committed, date);
  assert.equal(actual[0].id, meeting.id);
  assert.equal(actual[0].time, '13:10');
  assert.equal(actual[0].important, true);
  assert.equal(actual[0].alarm, true);
  assert.equal(actual[1].id, original[2].id);
  assert.equal(
    committed.dailyPlanItems.find((item) => item.date !== date),
    other,
  );
  assert.deepEqual(committed.dailyPlanOrders.find((item) => item.date === date).itemIds, [
    'recurring:keep',
    'daily:' + meeting.id,
    'daily:' + original[2].id,
  ]);
  assert.equal(finalizeDailyNote(committed, date), committed);
  const empty = finalizeDailyNote(applyDailyNote(emptyData(), date, ' ,  ,, ', createId), date);
  assert.deepEqual(empty.dailyPlanItems, []);
  assert.deepEqual(empty.dailyPlanOrders[0].itemIds, []);
});

test('multiline chips retain their line breaks through save and reopening', () => {
  const text = '회의\n안건 정리,운동';
  const data = applyDailyNote(emptyData(), date, text, createId);
  assert.deepEqual(read(data), ['회의\n안건 정리', '운동']);
  assert.equal(applyDailyNote(data, date, text, createId), data);
});

test('unchanged siblings retain references while editing one schedule', () => {
  const original = applyDailyNote(emptyData(), date, '회의,운동,독서', createId);
  const before = dailyNoteItems(original, date);
  const next = applyDailyNote(original, date, '회의,산책,독서', createId);
  const after = dailyNoteItems(next, date);
  assert.equal(after[0], before[0]);
  assert.equal(after[2], before[2]);
  assert.notEqual(after[1], before[1]);
});

test('inline nonempty time changes clear alarms while unrelated timed chips retain theirs', () => {
  let data = applyDailyNote(emptyData(), date, '13:00 회의,18:00 운동', createId, true);
  data = { ...data, dailyPlanItems: data.dailyPlanItems.map((item) => ({ ...item, alarm: true })) };
  const before = dailyNoteItems(data, date);
  const after = dailyNoteItems(
    applyDailyNote(data, date, '14:00 회의,18:00 운동', createId, true),
    date,
  );
  assert.equal(after[0].alarm, undefined);
  assert.equal(after[1].alarm, true);
  assert.equal(after[1], before[1]);
});
