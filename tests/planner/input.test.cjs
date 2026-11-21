const { assert, test } = require('../support/test.cjs');
const {
  hooks,
  changeInput,
  find,
  flushFrames,
  renderInput,
  state,
} = require('../support/planner.cjs');
const chip = (tree, content) =>
  find(tree, (node) => node.type?.name === 'ScheduleChip' && node.props.content === content);

test('only the tapped chip becomes text; a blank-area tap appends an empty editor', () => {
  let editor = renderInput('회의,운동', 0);
  assert.equal(state.nativeText, '회의');
  assert.equal(chip(editor.tree, '회의'), undefined);
  assert.ok(chip(editor.tree, '운동'));
  hooks.reset();
  state.nativeText = undefined;
  editor = renderInput('회의,운동');
  assert.equal(state.nativeText, '');
  assert.ok(chip(editor.tree, '회의'));
  assert.ok(chip(editor.tree, '운동'));
});

test('inserting between chips preserves both neighbors and commits on comma', () => {
  let editor = renderInput('회의,운동', undefined, undefined, { initialSlot: 1 });
  assert.equal(editor.tree.props.children[1].type, 'TextInput');
  changeInput(editor.input, '점심,');
  editor = renderInput('회의,운동');
  assert.ok(chip(editor.tree, '회의'));
  assert.ok(chip(editor.tree, '점심'));
  assert.ok(chip(editor.tree, '운동'));
  assert.equal(editor.tree.props.children[2].type, 'TextInput');
  assert.equal(state.nativeText, '');
  changeInput(editor.input, '산책');
  assert.equal(state.saved.at(-1), '회의,점심,산책,운동');
});

test('switching chips commits the current text and opens only the next chip', () => {
  let editor = renderInput('회의,운동', 0);
  changeInput(editor.input, '회의 수정');
  chip(editor.tree, '운동').props.onPress();
  editor = renderInput('회의,운동', 0);
  assert.equal(state.nativeText, '운동');
  assert.ok(chip(editor.tree, '회의 수정'));
  assert.equal(chip(editor.tree, '운동'), undefined);
  changeInput(editor.input, '산책');
  assert.equal(state.saved.at(-1), '회의 수정,산책');
});

test('switching from an empty insertion does not delete or shift the tapped chip', () => {
  let editor = renderInput('회의,운동', undefined, undefined, { initialSlot: 0 });
  chip(editor.tree, '운동').props.onPress();
  editor = renderInput('회의,운동');
  assert.equal(state.nativeText, '운동');
  changeInput(editor.input, '산책');
  assert.equal(state.saved.at(-1), '회의,산책');
});

test('chip edges move the insertion point while editing', () => {
  let editor = renderInput('회의,운동', 0);
  chip(editor.tree, '운동').props.onBefore();
  editor = renderInput('회의,운동');
  changeInput(editor.input, '점심');
  assert.equal(state.saved.at(-1), '회의,점심,운동');
});

test('Hangul composition and newlines leave ordinary typing to native input', () => {
  let editor = renderInput('', 0);
  flushFrames();
  const writes = hooks.getStateWrites();
  for (const text of ['ㅎ', '하', '한', '한글', '한글\n안건']) {
    changeInput(editor.input, text);
    editor = renderInput('', 0);
    assert.equal(hooks.getStateWrites(), writes);
    assert.equal(editor.input.props.value, undefined);
    assert.equal(state.saved.at(-1), text);
  }
  assert.deepEqual(state.nativeWrites, []);
});

test('saved times remain editable and untouched schedule times are retained', () => {
  const editor = renderInput('회의,운동', 0, undefined, { noteTimes: ['13:10', '18:00'] });
  assert.equal(state.nativeText, '13:10 회의');
  changeInput(editor.input, '회의');
  assert.equal(state.saved.at(-1), '회의,18:00 운동');
});

test('stale native events cannot replace newer input', () => {
  const editor = renderInput('회의,운동', 0);
  changeInput(editor.input, '회의 수정', 10);
  changeInput(editor.input, '회의', 9);
  changeInput(editor.input, '회의', 10);
  assert.equal(state.saved.at(-1), '회의 수정,운동');
});

test('oversized text restores only the active buffer and typing resumes', () => {
  let editor = renderInput('회의,운동', 1);
  changeInput(editor.input, '가'.repeat(256));
  editor = renderInput('회의,운동', 1);
  assert.equal(state.nativeText, '운동');
  assert.equal(state.toasts.length, 1);
  assert.deepEqual(state.saved, []);
  changeInput(editor.input, '산책');
  assert.equal(state.saved.at(-1), '회의,산책');
});

test('pasting multiple schedules commits preceding chips and edits the final segment', () => {
  let editor = renderInput('처음,끝', undefined, undefined, { initialSlot: 1 });
  changeInput(editor.input, '회의\r\n안건, 운동');
  editor = renderInput('처음,끝');
  assert.equal(state.saved.at(-1), '처음,회의\n안건,운동,끝');
  assert.ok(chip(editor.tree, '회의\n안건'));
  assert.equal(state.nativeText, '운동');
});

test('blur commits once; tapping another chip cancels the pending row exit', () => {
  let closed = 0;
  let editor = renderInput('회의,운동', 0, undefined, { onBlur: () => closed++ });
  editor.input.props.onBlur();
  chip(editor.tree, '운동').props.onPress();
  editor = renderInput('회의,운동', 0, undefined, { onBlur: () => closed++ });
  flushFrames();
  assert.equal(closed, 0);
  editor.input.props.onBlur();
  flushFrames();
  assert.equal(closed, 1);
  hooks.unmount();
  assert.equal(state.flushes, 1);
});

test('unmount without native blur still finishes the pending draft', () => {
  renderInput('회의', 0);
  hooks.unmount();
  assert.equal(state.flushes, 1);
});

test('inserting a blank slot retains important and alarm marks on the following chip', () => {
  let editor = renderInput('회의,운동', undefined, undefined, {
    initialSlot: 0,
    noteImportant: [true, false],
    noteAlarms: [true, false],
  });
  assert.equal(chip(editor.tree, '회의').props.important, true);
  assert.equal(chip(editor.tree, '회의').props.alarm, true);
  changeInput(editor.input, '점심,');
  editor = renderInput('회의,운동');
  assert.equal(chip(editor.tree, '회의').props.important, true);
  assert.equal(chip(editor.tree, '회의').props.alarm, true);
});
