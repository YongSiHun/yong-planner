const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  boundary,
  changeInput,
  find,
  flushFrames,
  renderInput,
  state,
} = require('../support/planner.cjs');

test('backspace first opens the last chip for editing without deleting its text', () => {
  let { input } = renderInput();
  assert.equal(input.props.value, boundary);
  changeInput(input, '');
  ({ input } = renderInput());
  assert.equal(input.props.value, boundary + '장보기');
  assert.equal(state.saved.at(-1), '회의,장보기');
  changeInput(input, ''); // 이전 빈 입력의 지연 삭제 이벤트.
  ({ input } = renderInput());
  assert.equal(input.props.value, boundary + '장보기');
  assert.equal(state.saved.at(-1), '회의,장보기');
  flushFrames();
  input.props.onSelectionChange({ nativeEvent: { selection: { start: 4, end: 4 } } });
  ({ input } = renderInput());
  changeInput(input, boundary + '장보');
  assert.equal(state.saved.at(-1), '회의,장보');
});

test('split followed by backspace keeps one copy of the chip and hides the comma', () => {
  let { input } = renderInput('회의', 0);
  changeInput(input, '회의,');
  ({ input } = renderInput('회의', 0));
  assert.equal(input.props.value, boundary);
  changeInput(input, '');
  ({ input } = renderInput('회의', 0));
  assert.equal(input.props.value, '회의');
  assert.equal(state.saved.at(-1), '회의');
  changeInput(input, '');
  assert.equal(state.saved.at(-1), '회의');
});

test('chip focus and caret wait for committed text and ignore old selection events', () => {
  let editor = renderInput('회의,장보기,운동');
  flushFrames();
  state.selections = [];
  const first = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '회의',
  );
  first.props.onPress();
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.value, '회의');
  assert.deepEqual(editor.input.props.selection, { start: 2, end: 2 });
  // 이전 native 선택 이벤트: 새 커서 요청 유지.
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 2, end: 2 } } });
  editor = renderInput('회의,장보기,운동');
  assert.deepEqual(editor.input.props.selection, { start: 2, end: 2 });
  const second = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  second.props.onPress();
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.value, boundary + '장보기');
  assert.deepEqual(state.selections, []);
  flushFrames();
  assert.deepEqual(state.selections, [{ start: 4, end: 4 }]);
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 4, end: 4 } } });
  editor = renderInput('회의,장보기,운동');
  assert.equal(editor.input.props.selection, undefined);
  editor.input.props.onSelectionChange({ nativeEvent: { selection: { start: 2, end: 2 } } });
  editor = renderInput('회의,장보기,운동');
  flushFrames();
  assert.equal(editor.input.props.selection, undefined);
  assert.deepEqual(state.selections, [{ start: 4, end: 4 }]);
  assert.deepEqual(state.saved, []);
});

test('chip edges insert exactly before or after the tapped chip without saving an empty schedule', () => {
  let editor = renderInput('회의,장보기', 0);
  const chip = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  chip.props.onBefore();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '중간');
  assert.equal(state.saved.at(-1), '회의,중간,장보기');
  const after = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  after.props.onAfter();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '마지막');
  assert.equal(state.saved.at(-1), '회의,중간,장보기,마지막');
});

test('normal Korean composition can replace existing syllables immediately after selecting a chip', () => {
  let editor = renderInput('첫번째,회의', 0);
  find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '회의',
  ).props.onPress();
  editor = renderInput('첫번째,회의', 0);
  changeInput(editor.input, boundary + '회이');
  assert.equal(state.saved.at(-1), '첫번째,회이');
});

test('programmatic boundary caret releases even if native selection acknowledgment is missing', () => {
  let editor = renderInput('회의,장보기', 0);
  const chip = find(
    editor.tree,
    (node) => node.type?.name === 'ScheduleChip' && node.props.content === '장보기',
  );
  chip.props.onBefore();
  editor = renderInput('회의,장보기', 0);
  flushFrames();
  flushFrames();
  editor = renderInput('회의,장보기', 0);
  assert.equal(editor.input.props.selection, undefined);
  assert.deepEqual(state.saved, []);
});

test('saved times are editable native input text and cannot remain as undeletable labels', () => {
  const options = { noteTimes: ['13:10', '18:00'] };
  let editor = renderInput('회의,운동', 0, () => {}, options);
  assert.equal(editor.input.props.value, '13:10 회의');
  changeInput(editor.input, '회의');
  editor = renderInput('회의,운동', 0, () => {}, options);
  assert.equal(editor.input.props.value, '회의');
  assert.equal(state.saved.at(-1), '회의,18:00 운동');
  assert.equal(
    find(editor.tree, (node) => node.type?.name === 'ActiveTimeLabel'),
    undefined,
  );
});

test('backspacing through a timed chip removes every character without recreating its time label', () => {
  const options = { noteTimes: ['13:10'] };
  let editor = renderInput('회의', 0, () => {}, options);
  const original = editor.input.props.value;
  for (let length = original.length - 1; length >= 0; length--) {
    changeInput(editor.input, original.slice(0, length));
    editor = renderInput('회의', 0, () => {}, options);
    assert.equal(editor.input.props.value, original.slice(0, length));
  }
  assert.equal(state.saved.at(-1), '');
});

test('enter creates the next chip without a newline and keeps the editor available', () => {
  let editor = renderInput('회의', 0);
  changeInput(editor.input, '회의\n');
  editor = renderInput('회의', 0);
  assert.equal(state.saved.at(-1), '회의,');
  assert.equal(editor.input.props.value, boundary);
  changeInput(editor.input, boundary + '운동');
  editor = renderInput('회의', 0);
  assert.equal(state.saved.at(-1), '회의,운동');
  assert.equal(editor.input.props.value, boundary + '운동');
});

test('ordinary caret movement does not request page measurement or reset the native selection', () => {
  let reveals = 0;
  const options = { onInputLayout: () => reveals++ };
  let editor = renderInput('회의', 0, () => {}, options);
  flushFrames();
  flushFrames();
  editor = renderInput('회의', 0, () => {}, options);
  reveals = 0;
  state.selections = [];
  changeInput(editor.input, '회의하기');
  editor = renderInput('회의', 0, () => {}, options);
  for (const position of [4, 3, 2, 1]) {
    editor.input.props.onSelectionChange({
      nativeEvent: { selection: { start: position, end: position } },
    });
  }
  flushFrames();
  assert.equal(reveals, 0);
  assert.deepEqual(state.selections, []);
});

test('blur commits trimmed chips without changing intentional spaces inside a schedule', () => {
  const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
  const note = ' 회의  내용  , , 운동 ,';
  let id = 0;
  state.plannerData = applyDailyNote(state.plannerData, '2026-11-07', note, () => 'commit-' + ++id);
  const editor = renderInput(note, 0);
  assert.equal(editor.input.props.value, ' 회의  내용  ');
  editor.input.props.onBlur();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.content),
    ['회의  내용', '운동'],
  );
});

test('leaving an editor without native blur commits its chips and flushes once', () => {
  const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-07',
    ' meeting , , exercise ,',
    () => 'leave-' + ++id,
  );
  renderInput(' meeting , , exercise ,', 0);
  for (const slot of state.slots) slot?.cleanup?.();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.content),
    ['meeting', 'exercise'],
  );
  assert.equal(state.flushes, 1);
});

test('blur followed by unmount does not save the same edit twice', () => {
  const editor = renderInput('meeting', 0);
  editor.input.props.onBlur();
  for (const slot of state.slots) slot?.cleanup?.();
  assert.equal(state.flushes, 1);
});
