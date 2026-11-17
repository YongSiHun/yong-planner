const { assert, test } = require('../support/test.cjs');
const {
  hooks,
  changeInput,
  find,
  flushFrames,
  renderInput,
  state,
} = require('../support/planner.cjs');
const resize = (editor, height) =>
  editor.input.props.onContentSizeChange({ nativeEvent: { contentSize: { width: 240, height } } });

test('plain multiline input has no fixed box and grows and shrinks with native content', () => {
  let editor = renderInput('', 0);
  flushFrames();
  flushFrames();
  editor = renderInput('', 0);
  assert.equal(editor.input.props.style.height, undefined);
  assert.equal(editor.input.props.style.borderWidth, undefined);
  assert.equal(editor.tree.props.style.minHeight, undefined);
  assert.equal(editor.input.props.scrollEnabled, false);
  assert.equal(editor.input.props.submitBehavior, 'newline');
  for (const [text, height] of [
    ['한글', 26],
    ['한글\n안건 정리', 48],
    ['긴 내용 '.repeat(30), 180],
    ['짧게', 26],
  ]) {
    changeInput(editor.input, text);
    resize(editor, height);
    editor = renderInput('', 0);
    assert.equal(editor.input.props.style.height, height);
    assert.equal(
      find(editor.tree, (node) => node.type?.name === 'ScheduleChip'),
      undefined,
    );
  }
});

test('native content height supports larger fonts without hidden measurement or redundant updates', () => {
  for (const fontScale of [1, 1.4, 2]) {
    hooks.reset();
    state.dimensions.fontScale = fontScale;
    let editor = renderInput('한글\n여러 줄', 0);
    const height = Math.ceil(48 * fontScale);
    resize(editor, height);
    editor = renderInput('한글\n여러 줄', 0);
    assert.equal(editor.input.props.style.height, height);
    const writes = hooks.getStateWrites();
    resize(editor, height);
    resize(editor, 0);
    assert.equal(hooks.getStateWrites(), writes);
    assert.equal(
      find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout),
      undefined,
    );
  }
});

test('commas stay in the same native editor without creating chip children', () => {
  let editor = renderInput('', 0);
  const ref = editor.input.props.ref;
  for (const text of ['첫째,', '첫째,둘째,', '첫째,둘째,셋째']) {
    changeInput(editor.input, text);
    editor = renderInput('', 0);
    assert.equal(editor.input.props.ref, ref);
    assert.equal(state.nativeText, text);
    assert.equal(
      find(editor.tree, (node) => node.type?.name === 'ScheduleChip'),
      undefined,
    );
  }
});

test('initial editor text and caret include all schedules and editable times', () => {
  const { initialScheduleEdit } = require('../../src/features/planner/services/noteEditor.ts');
  assert.deepEqual(initialScheduleEdit('회의,운동', []), { text: '회의, 운동', caret: 6 });
  assert.deepEqual(initialScheduleEdit('회의,운동', [], 0), { text: '회의, 운동', caret: 2 });
  assert.deepEqual(initialScheduleEdit('회의,운동', [], 1), { text: '회의, 운동', caret: 6 });
  assert.deepEqual(initialScheduleEdit('회의,운동', [], undefined, 1), {
    text: '회의, 운동',
    caret: 4,
  });
  assert.deepEqual(initialScheduleEdit('회의,운동', [], undefined, 2), {
    text: '회의, 운동',
    caret: 6,
  });
  assert.deepEqual(initialScheduleEdit('회의\n안건,운동', ['13:10', null], 0), {
    text: '13:10 회의\n안건, 운동',
    caret: '13:10 회의\n안건'.length,
  });
  assert.deepEqual(initialScheduleEdit('', [], 99), { text: '', caret: 0 });
});
