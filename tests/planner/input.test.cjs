const { assert, test } = require('../support/test.cjs');
const {
  hooks,
  changeInput,
  find,
  flushFrames,
  renderInput,
  state,
} = require('../support/planner.cjs');

test('both a blank-area tap and a chip tap open the whole date with visible comma separators', () => {
  for (const index of [undefined, 0, 1]) {
    hooks.reset();
    state.nativeText = undefined;
    const editor = renderInput('회의,장보기,운동', index);
    assert.equal(state.nativeText, '회의, 장보기, 운동');
    assert.equal(
      find(editor.tree, (node) => node.type?.name === 'ScheduleChip'),
      undefined,
    );
  }
});

test('the initial caret targets the tapped schedule and is then left to the native editor', () => {
  let editor = renderInput('회의,장보기,운동', 1);
  flushFrames();
  assert.deepEqual(state.selections, [{ start: 7, end: 7 }]);
  assert.equal(editor.input.props.selection, undefined);
  changeInput(editor.input, '회의,장보기 수정,운동');
  editor = renderInput('회의,장보기,운동', 1);
  flushFrames();
  assert.equal(state.selections.length, 1);
  assert.equal(state.saved.at(-1), '회의,장보기 수정,운동');
});

test('Hangul composition, commas and newlines dispatch no React state updates or native text writes', () => {
  let editor = renderInput('', 0);
  flushFrames();
  state.selections = [];
  const writes = hooks.getStateWrites();
  const ref = editor.input.props.ref;
  for (const text of ['ㅎ', '하', '한', '한ㄱ', '한글', '한글,ㅎ', '한글,한\n글']) {
    changeInput(editor.input, text);
    assert.equal(hooks.getStateWrites(), writes);
    editor = renderInput('', 0);
    assert.equal(editor.input.props.ref, ref);
    assert.equal(editor.input.props.defaultValue, '');
    assert.equal(editor.input.props.value, undefined);
    assert.equal(state.saved.at(-1), text);
    assert.equal(
      find(editor.tree, (node) => node.type?.name === 'ScheduleChip'),
      undefined,
    );
  }
  flushFrames();
  assert.deepEqual(state.nativeWrites, []);
  assert.deepEqual(state.selections, []);
});

test('a fast first keystroke cancels pending initial caret placement', () => {
  const editor = renderInput('회의', 0);
  changeInput(editor.input, '회의ㅎ');
  flushFrames();
  assert.deepEqual(state.selections, []);
  assert.equal(state.saved.at(-1), '회의ㅎ');
});

test('deleting a comma merges schedules with no sentinel or text replacement', () => {
  const editor = renderInput('회의,장보기', 0);
  changeInput(editor.input, '회의장보기');
  assert.equal(state.saved.at(-1), '회의장보기');
  assert.deepEqual(state.nativeWrites, []);
});

test('every saved time is editable and deleting one retains the other schedule time', () => {
  const editor = renderInput('회의,운동', 0, undefined, { noteTimes: ['13:10', '18:00'] });
  assert.equal(state.nativeText, '13:10 회의, 18:00 운동');
  changeInput(editor.input, '회의,18:00 운동');
  assert.equal(state.saved.at(-1), '회의,18:00 운동');
});

test('native events arriving before a render keep the newest complete text', () => {
  const editor = renderInput('회의', 0);
  for (const text of ['회의,ㅎ', '회의,하', '회의,한', '회의,한글\n둘째 줄']) {
    changeInput(editor.input, text);
  }
  assert.equal(state.saved.at(-1), '회의,한글\n둘째 줄');
  assert.deepEqual(state.nativeWrites, []);
});

test('stale and repeated native event counts cannot replace newer input', () => {
  const editor = renderInput('회의', 0);
  changeInput(editor.input, '회의 내용', 10);
  const count = state.saved.length;
  changeInput(editor.input, '회의', 9);
  changeInput(editor.input, '회의', 10);
  assert.equal(state.saved.length, count);
  assert.equal(state.saved.at(-1), '회의 내용');
  assert.deepEqual(state.nativeWrites, []);
});

test('oversized text restores the last valid full-date buffer and typing resumes', () => {
  const original = '회의,' + '가'.repeat(255);
  let editor = renderInput(original, 1);
  changeInput(editor.input, original + '나');
  editor = renderInput(original, 1);
  assert.equal(state.nativeText, original.replace(',', ', '));
  assert.equal(state.toasts.length, 1);
  assert.deepEqual(state.saved, []);
  changeInput(editor.input, original.slice(0, -1));
  editor = renderInput(original, 1);
  assert.equal(editor.input.props.value, undefined);
  assert.equal(state.saved.at(-1), original.slice(0, -1));
});

test('the character limit applies per comma-separated schedule rather than per date', () => {
  const editor = renderInput('', 0);
  changeInput(editor.input, '가'.repeat(255) + ',' + '나'.repeat(255));
  assert.equal(state.saved.at(-1), '가'.repeat(255) + ',' + '나'.repeat(255));
  changeInput(editor.input, '가'.repeat(255) + ',' + '나'.repeat(256));
  assert.equal(state.toasts.length, 1);
});

test('pasted line endings stay inside schedules and normalize to LF', () => {
  let editor = renderInput('', 0);
  changeInput(editor.input, '회의\r\n안건\r정리,운동');
  editor = renderInput('', 0);
  assert.equal(state.saved.at(-1), '회의\n안건\n정리,운동');
  assert.equal(state.nativeText, '회의\n안건\n정리,운동');
});

test('blur and unmount finish once and preserve internal spaces', () => {
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

test('unmount without native blur still finishes the pending draft', () => {
  renderInput('회의', 0);
  hooks.unmount();
  assert.equal(state.flushes, 1);
});

test('opening uses one separator space while saving preserves times, content spaces and the full length limit', () => {
  const content = '가'.repeat(255);
  let editor = renderInput('회의,   ' + content + ',  운동  계획', 1, undefined, {
    noteTimes: ['13:10', null, '18:00'],
  });
  const display = '13:10 회의, ' + content + ', 18:00   운동  계획';
  assert.equal(state.nativeText, display);
  changeInput(editor.input, display);
  editor = renderInput('회의,   ' + content + ',  운동  계획', 1);
  assert.deepEqual(state.toasts, []);
  assert.equal(state.saved.at(-1), '13:10 회의,' + content + ',18:00   운동  계획');
  assert.equal(editor.input.props.value, undefined);
  assert.deepEqual(state.nativeWrites, []);
});
