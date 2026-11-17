const { assert, test } = require('../support/test.cjs');
const {
  hooks,
  boundary,
  changeInput,
  find,
  flushFrames,
  renderInput,
  state,
} = require('../support/planner.cjs');
const chip = (tree, content) =>
  find(tree, (node) => node.type?.name === 'ScheduleChip' && node.props.content === content);
const settle = (note, index) => {
  renderInput(note, index);
  flushFrames();
  flushFrames();
  return renderInput(note, index);
};

test('comma immediately creates a chip while the next plain editor hides the separator', () => {
  let editor = settle('회의', 0);
  const ref = editor.input.props.ref;
  changeInput(editor.input, '회의,');
  editor = renderInput('회의', 0);
  assert.ok(chip(editor.tree, '회의'));
  assert.equal(state.nativeText, boundary);
  assert.equal(state.saved.at(-1), '회의,');
  assert.equal(editor.input.props.ref, ref);
  assert.equal(editor.input.key, 'active-input');
  assert.equal(state.nativeText.includes(','), false);
});

test('editing an existing chip shows only its content with no visible comma', () => {
  let editor = settle('회의,장보기,운동', 1);
  assert.equal(state.nativeText, boundary + '장보기');
  assert.equal(state.nativeText.includes(','), false);
  assert.equal(chip(editor.tree, '장보기'), undefined);
  assert.ok(chip(editor.tree, '회의'));
  chip(editor.tree, '운동').props.onPress();
  editor = renderInput('회의,장보기,운동', 1);
  assert.equal(state.nativeText, boundary + '운동');
  assert.equal(state.nativeText.includes(','), false);
});

test('ordinary Hangul and multiline composition dispatch no React state updates or native writes', () => {
  let editor = settle('회의,장보기,운동', 1);
  const writes = hooks.getStateWrites();
  const ref = editor.input.props.ref;
  const initial = editor.input.props.defaultValue;
  state.selections = [];
  state.nativeWrites = [];
  for (const text of ['장보ㄱ', '장보기', '장보기 ㅎ', '장보기 한', '장보기 한글\n둘째 줄']) {
    changeInput(editor.input, boundary + text);
    assert.equal(hooks.getStateWrites(), writes);
    editor = renderInput('회의,장보기,운동', 1);
    assert.equal(editor.input.props.value, undefined);
    assert.equal(editor.input.props.defaultValue, initial);
    assert.equal(editor.input.props.ref, ref);
    assert.equal(state.saved.at(-1), '회의,' + text + ',운동');
  }
  flushFrames();
  assert.deepEqual(state.selections, []);
  assert.deepEqual(state.nativeWrites, []);
});

test('backspace at the boundary restores the previous chip once', () => {
  let editor = settle('회의,장보기', undefined);
  changeInput(editor.input, '');
  editor = renderInput('회의,장보기');
  assert.equal(state.nativeText, boundary + '장보기');
  assert.equal(state.saved.at(-1), '회의,장보기');
  changeInput(editor.input, '');
  editor = renderInput('회의,장보기');
  assert.equal(state.nativeText, boundary + '장보기');
});

test('chip edges insert at the correct position and selection keeps the latest typed text', () => {
  let editor = settle('회의,운동', 0);
  changeInput(editor.input, '회의 수정');
  chip(editor.tree, '운동').props.onBefore();
  editor = renderInput('회의,운동', 0);
  changeInput(editor.input, boundary + '중간');
  assert.equal(state.saved.at(-1), '회의 수정,중간,운동');
});

test('rapid native split and Hangul events before rendering retain the newest buffer', () => {
  let editor = settle('회의', 0);
  state.nativeWrites = [];
  for (const text of ['회의,', boundary + 'ㅎ', boundary + '하', boundary + '한']) {
    changeInput(editor.input, text);
  }
  editor = renderInput('회의', 0);
  assert.equal(editor.input.props.value, undefined);
  assert.equal(state.nativeText, boundary + '한');
  assert.equal(state.saved.at(-1), '회의,한');
  assert.ok(chip(editor.tree, '회의'));
  assert.deepEqual(state.nativeWrites, []);
});

test('saved times are editable and deletable text inside the active editor', () => {
  let editor = renderInput('회의,운동', 0, undefined, { noteTimes: ['13:10', '18:00'] });
  assert.equal(state.nativeText, '13:10 회의');
  changeInput(editor.input, '회의');
  assert.equal(state.saved.at(-1), '회의,18:00 운동');
});

test('stale native events never rewrite the latest composing text', () => {
  let editor = settle('회의', 0);
  changeInput(editor.input, '회의 한', 10);
  const writes = hooks.getStateWrites();
  changeInput(editor.input, '회의 ㅎ', 9);
  editor = renderInput('회의', 0);
  assert.equal(state.saved.at(-1), '회의 한');
  assert.equal(hooks.getStateWrites(), writes);
  assert.equal(editor.input.props.value, undefined);
  assert.deepEqual(state.nativeWrites, []);
});

test('invalid oversized text restores the last valid buffer and valid typing resumes', () => {
  const original = '가'.repeat(255);
  let editor = settle(original, 0);
  changeInput(editor.input, original + '나');
  editor = renderInput(original, 0);
  assert.equal(state.nativeText, original);
  assert.equal(state.toasts.length, 1);
  assert.deepEqual(state.saved, []);
  changeInput(editor.input, original.slice(1));
  editor = renderInput(original, 0);
  assert.equal(editor.input.props.value, undefined);
  assert.equal(state.saved.at(-1), original.slice(1));
});

test('blur and unmount finalize once and retain intentional internal spaces', () => {
  const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-07',
    ' 회의  내용 , , 운동 ,',
    () => 'commit-' + ++id,
  );
  const editor = renderInput(' 회의  내용 , , 운동 ,', 0);
  editor.input.props.onBlur();
  hooks.unmount();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.content),
    ['회의  내용', '운동'],
  );
  assert.equal(state.flushes, 1);
});

test('unmount without native blur still finishes pending input', () => {
  renderInput('회의', 0);
  hooks.unmount();
  assert.equal(state.flushes, 1);
});
