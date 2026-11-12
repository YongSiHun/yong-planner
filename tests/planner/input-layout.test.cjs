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

test('editing a chip uses its measured text width and leaves room for following chips', () => {
  let editor = renderInput('회의,장보기,운동', 1);
  assert.equal(editor.input.props.style.flexGrow, 0);
  const measurement = find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout);
  measurement.props.onTextLayout({ nativeEvent: { lines: [{ width: 48 }] } });
  editor = renderInput('회의,장보기,운동', 1);
  assert.ok(editor.input.props.style.width >= 48 + 16);
  assert.ok(editor.input.props.style.width < state.dimensions.width - 68);
  assert.ok(
    find(
      editor.tree,
      (node) => node.type?.name === 'ScheduleChip' && node.props.content === '운동',
    ),
  );
  editor.tree.props.onLayout({ nativeEvent: { layout: { width: 160 } } });
  changeInput(editor.input, boundary + '아주 긴 일정 내용입니다');
  editor = renderInput('회의,장보기,운동', 1);
  assert.ok(editor.input.props.style.width <= 150);
  assert.equal(editor.input.props.style.flexGrow, 0);
});

test('typing after a wide word never first shrinks the editor to an estimated narrower width', () => {
  let editor = renderInput('WWWW', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: { lines: [{ width: 56 }] },
  });
  editor = renderInput('WWWW', 0);
  const before = editor.input.props.style.width;
  changeInput(editor.input, 'WWWWW');
  editor = renderInput('WWWW', 0);
  assert.ok(editor.input.props.style.width >= before);
});

test('editor stays within available phone and tablet widths at larger font scales', () => {
  for (const width of [320, 360, 768, 1024, 1366]) {
    for (const fontScale of [1, 1.4, 2]) {
      state.slots = [];
      state.dimensions = { width, height: 800, fontScale };
      const available = Math.min(width, 960) - 88;
      let editor = renderInput('아주 긴 일정 내용입니다 '.repeat(30), 0);
      editor.tree.props.onLayout({ nativeEvent: { layout: { width: available } } });
      editor = renderInput('아주 긴 일정 내용입니다 '.repeat(30), 0);
      assert.ok(editor.input.props.style.width <= available);
      assert.ok(editor.input.props.style.width >= 30);
      assert.ok(editor.input.props.style.height <= 240);
    }
  }
});

test('native content-size changes cannot undo measured wrapped lines', () => {
  let editor = renderInput('회의', 0);
  changeInput(editor.input, '회의 내용이 길어서 자동으로 줄이 나뉘는 일정');
  editor = renderInput('회의', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: { lines: [{ width: 40 }, { width: 80 }] },
  });
  editor = renderInput('회의', 0);
  const height = editor.input.props.style.height;
  editor.input.props.onContentSizeChange({ nativeEvent: { contentSize: { height: 22 } } });
  editor = renderInput('회의', 0);
  assert.equal(editor.input.props.value, '회의 내용이 길어서 자동으로 줄이 나뉘는 일정');
  assert.equal(editor.input.props.style.height, height);
  assert.ok(height >= 52);
});

test('large font line measurements keep enough height for every explicit line', () => {
  state.dimensions.fontScale = 2;
  let editor = renderInput('회의\n운동', 0);
  find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout({
    nativeEvent: {
      lines: [
        { width: 60, height: 44 },
        { width: 60, height: 44 },
      ],
    },
  });
  editor = renderInput('회의\n운동', 0);
  assert.equal(editor.input.props.style.height, 96);
});

test('the first keystroke keeps the empty editor width and font stable', () => {
  let editor = renderInput('', 0);
  const before = editor.input.props.style;
  changeInput(editor.input, 'ㅎ');
  editor = renderInput('', 0);
  assert.equal(editor.input.props.style.width, before.width);
  assert.equal(editor.input.props.style.fontSize, before.fontSize);
  assert.equal(editor.input.props.style.lineHeight, before.lineHeight);
});

test('Korean composition and delayed width measurements do not shrink or resize the editor per syllable', () => {
  let editor = renderInput('회의,장보기,운동', 1);
  flushFrames();
  flushFrames();
  editor = renderInput('회의,장보기,운동', 1);
  const before = editor.input.props.style.width;
  state.selections = [];
  for (const [text, width] of [
    ['장보ㄱ', 44],
    ['장보기', 45],
    ['장보', 30],
    ['장보기', 43],
  ]) {
    changeInput(editor.input, boundary + text);
    editor = renderInput('회의,장보기,운동', 1);
    find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout).props.onTextLayout(
      {
        nativeEvent: { lines: [{ width }] },
      },
    );
    editor = renderInput('회의,장보기,운동', 1);
    assert.equal(editor.input.props.style.width, before);
    assert.equal(editor.input.props.value, boundary + text);
  }
  flushFrames();
  assert.deepEqual(state.selections, []);
});

test('empty input measures wrapped placeholder text so the hint is not clipped', () => {
  let editor = renderInput('', 0);
  const measurement = find(editor.tree, (node) => node.type === 'Text' && node.props.onTextLayout);
  assert.equal(measurement.props.children, editor.input.props.placeholder);
  measurement.props.onTextLayout({
    nativeEvent: {
      lines: [
        { width: 230, height: 22 },
        { width: 210, height: 22 },
      ],
    },
  });
  editor = renderInput('', 0);
  assert.ok(editor.input.props.style.height >= 52);
  changeInput(editor.input, '회의');
  editor = renderInput('', 0);
  const contentMeasurement = find(
    editor.tree,
    (node) => node.type === 'Text' && node.props.onTextLayout,
  );
  assert.equal(contentMeasurement.props.children, '회의');
});
