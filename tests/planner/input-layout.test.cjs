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

test('the active editor is rectangular with fixed height and native scrolling', () => {
  let editor = renderInput('', 0);
  flushFrames();
  flushFrames();
  editor = renderInput('', 0);
  const before = editor.input.props.style;
  for (const text of ['ㅎ', '한글', '한글\n안건 정리', '긴 내용 '.repeat(30)]) {
    changeInput(editor.input, text);
    editor = renderInput('', 0);
    assert.deepEqual(editor.input.props.style, before);
    assert.equal(editor.input.props.scrollEnabled, true);
    assert.equal(editor.input.props.submitBehavior, 'newline');
  }
  assert.equal(before.width, '100%');
  assert.equal(before.padding, 12);
  assert.equal(before.borderRadius, 10);
  assert.equal(before.includeFontPadding, true);
  assert.ok(before.height >= before.lineHeight * 4 + before.padding * 2 + before.borderWidth * 2);
});

test('larger fonts use native scrolling without hidden text measurement or resize handlers', () => {
  for (const fontScale of [1, 1.4, 2]) {
    hooks.reset();
    state.dimensions.fontScale = fontScale;
    const editor = renderInput('한글\n여러 줄', 0);
    assert.equal(editor.input.props.onContentSizeChange, undefined);
    assert.equal(
      find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout),
      undefined,
    );
    assert.equal(editor.input.props.scrollEnabled, true);
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
    assert.equal(editor.input.props.style.borderRadius, 10);
  }
});
