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

test('creating a chip keeps the plain native editor under the same sibling key', () => {
  let editor = renderInput('', 0);
  const ref = editor.input.props.ref;
  for (const text of ['첫째,', boundary + '둘째,', boundary + '셋째']) {
    changeInput(editor.input, text);
    editor = renderInput('', 0);
    assert.equal(editor.input.key, 'active-input');
    assert.equal(editor.input.props.ref, ref);
    assert.equal(editor.input.props.style.borderWidth, undefined);
  }
});
