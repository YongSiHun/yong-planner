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

test('initial editor chooses one chip or creates a slot without exposing other text', () => {
  const { initialScheduleEdit } = require('../../src/features/planner/services/noteEditor.ts');
  assert.deepEqual(initialScheduleEdit('회의,운동', [], 1), {
    parts: ['회의', '운동'],
    active: 1,
    text: '운동',
    caret: 2,
  });
  assert.deepEqual(initialScheduleEdit('회의,운동', [], undefined, 1), {
    parts: ['회의', '', '운동'],
    active: 1,
    text: '',
    caret: 0,
  });
  assert.deepEqual(initialScheduleEdit('회의,운동', ['13:10', null], 0), {
    parts: ['13:10 회의', '운동'],
    active: 0,
    text: '13:10 회의',
    caret: 8,
  });
  assert.deepEqual(initialScheduleEdit('', [], 99), {
    parts: [''],
    active: 0,
    text: '',
    caret: 0,
  });
});

test('editing adds one visual line break immediately after the input, with following chips in row flow', () => {
  const editor = renderInput('회의,운동,식사', 1);
  const children = editor.tree.props.children;
  const index = children.findIndex((node) => node.type === 'TextInput');
  assert.equal(index, 1);
  assert.equal(children[index + 1].key, 'editor-break');
  assert.equal(children[index + 1].props.style.flexBasis, '100%');
  assert.equal(children[index + 1].props.style.height, 0);
  assert.equal(editor.tree.props.style.flexDirection, 'row');
  assert.equal(editor.tree.props.style.flexWrap, 'wrap');
  assert.equal(state.nativeText, '운동');
  assert.deepEqual(state.saved, []);
});

test('the final input does not add a trailing empty layout row', () => {
  const editor = renderInput('회의,운동', 1);
  assert.equal(
    find(editor.tree, (node) => node.key === 'editor-break'),
    undefined,
  );
});
