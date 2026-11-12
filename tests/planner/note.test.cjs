require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const {
  applyDailyNote,
  dailyNoteItems,
  splitNote,
  NOTE_SEPARATOR,
  replaceNotePart,
  mergeNotePart,
  changeNoteInput,
  noteInputValue,
  NOTE_INPUT_BOUNDARY,
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

test('commas create editable chips and periods remain ordinary schedule text', () => {
  assert.deepEqual(splitNote('3.5시간 공부,회의.'), ['3.5시간 공부', '회의.']);
  assert.deepEqual(replaceNotePart('회의', 0, '회의,'), { text: '회의,', index: 1, caret: 0 });
  assert.deepEqual(replaceNotePart('회의,', 1, '장보기'), {
    text: '회의,장보기',
    index: 1,
    caret: undefined,
  });
});

test('pasting several chips in the middle keeps the suffix and caret position', () => {
  assert.deepEqual(replaceNotePart('회의,운동', 0, '점심,회의'), {
    text: '점심,회의,운동',
    index: 1,
    caret: 0,
  });
  assert.deepEqual(replaceNotePart('a', 0, 'a,a'), { text: 'a,a', index: 1, caret: 1 });
  assert.deepEqual(replaceNotePart('회의', 0, '회의,장보기,산책'), {
    text: '회의,장보기,산책',
    index: 2,
    caret: 2,
  });
});

test('backspace at a chip boundary merges adjacent schedules and returns to the join position', () => {
  assert.deepEqual(mergeNotePart('회의,장보기', 1), { text: '회의장보기', index: 0, caret: 2 });
  assert.deepEqual(mergeNotePart('회의,', 1), { text: '회의', index: 0, caret: 2 });
  assert.deepEqual(mergeNotePart('회의, 장보기,산책', 1), {
    text: '회의 장보기,산책',
    index: 0,
    caret: 2,
  });
  assert.equal(mergeNotePart('회의', 0), null);
  assert.equal(mergeNotePart('회의', 2), null);
});

test('a comma becomes a chip without leaving a visible comma in the input', () => {
  const split = changeNoteInput({ text: '회의', index: 0 }, '회의,');
  assert.equal(split.text, '회의,');
  assert.equal(split.index, 1);
  assert.equal(noteInputValue(split), NOTE_INPUT_BOUNDARY);
  assert.equal(noteInputValue(split).includes(','), false);
  const typed = changeNoteInput(split, NOTE_INPUT_BOUNDARY + '장보기');
  assert.equal(typed.text, '회의,장보기');
  assert.equal(typed.text.includes(NOTE_INPUT_BOUNDARY), false);
});

test('native boundary deletion merges once and subsequent native text cannot duplicate the prefix', () => {
  let edit = { text: '회의,장보기', index: 1, caret: 0 };
  edit = changeNoteInput(edit, '장보기');
  assert.deepEqual(edit, { text: '회의장보기', index: 0, caret: 2 });
  edit = changeNoteInput(edit, noteInputValue(edit));
  assert.equal(edit.text, '회의장보기');
  edit = changeNoteInput(edit, '회의장보기 완료');
  assert.equal(edit.text, '회의장보기 완료');
});

test('repeated split and backspace preserve Korean text without duplication', () => {
  let edit = { text: '한글 일정', index: 0 };
  for (let index = 0; index < 20; index++) {
    edit = changeNoteInput(edit, noteInputValue(edit) + ',');
    edit = changeNoteInput(edit, '');
    assert.equal(edit.text, '한글 일정');
    assert.equal(edit.index, 0);
  }
});

test('middle merges preserve surrounding chips and strip copied input boundaries from saved text', () => {
  let edit = changeNoteInput({ text: '처음,회의, 장보기,끝', index: 2 }, ' 장보기');
  assert.equal(edit.text, '처음,회의 장보기,끝');
  assert.equal(edit.index, 1);
  edit = changeNoteInput(edit, noteInputValue(edit));
  assert.equal(edit.text, '처음,회의 장보기,끝');
  edit = changeNoteInput(edit, NOTE_INPUT_BOUNDARY + '회의' + NOTE_INPUT_BOUNDARY + ' 추가,산책');
  assert.equal(edit.text, '처음,회의 추가,산책,끝');
  assert.equal(edit.text.includes(NOTE_INPUT_BOUNDARY), false);
});
