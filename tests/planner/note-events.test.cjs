require('../support/register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NoteInputEvents } = require('../../src/features/planner/services/noteInputEvents.ts');
const { NOTE_INPUT_BOUNDARY: boundary } = require('../../src/features/planner/services/note.ts');

test('duplicate and out of order native events cannot create duplicate chips', () => {
  const events = new NoteInputEvents();
  let edit = { text: '회의', index: 0 };
  edit = events.change(edit, '회의,', 1);
  assert.equal(events.change(edit, '회의,', 1), null);
  assert.equal(events.change(edit, '회의,', 2), null);
  assert.equal(events.change(edit, '회의', 0), null);
  assert.equal(edit.text, '회의,');
});

test('fast typing against an uncleared native buffer creates each chip once', () => {
  const events = new NoteInputEvents();
  let edit = { text: '회의', index: 0 };
  for (const [count, text] of [
    '회의,',
    '회의,장',
    '회의,장보',
    '회의,장보기,',
    '회의,장보기,운동',
  ].entries()) {
    edit = events.change(edit, text, count + 1);
  }
  assert.equal(edit.text, '회의,장보기,운동');
});

test('backspace before native split synchronization restores the chip without repeating it', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '회의', index: 0 }, '회의,', 1);
  edit = events.change(edit, '회의', 2);
  assert.equal(edit.text, '회의');
  assert.equal(edit.index, 0);
});

test('intentionally typing the same schedule after synchronization still creates another item', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '회의', index: 0 }, '회의,', 1);
  events.acknowledge();
  edit = events.change(edit, boundary + '회의,', 2);
  assert.equal(edit.text, '회의,회의,');
});

test('selecting a different chip ignores native edits from the old chip until acknowledged', () => {
  const events = new NoteInputEvents();
  const edit = { text: '회의,장보기', index: 1 };
  events.select('회의', boundary + '장보기');
  assert.equal(events.change(edit, '회의', 1), null);
  events.acknowledge();
  assert.equal(events.change(edit, boundary + '장보기 완료', 2).text, '회의,장보기 완료');
});

test('deleting a restored chip before selection acknowledgement never copies its content', () => {
  const events = new NoteInputEvents();
  let edit = { text: '밥먹기,', index: 1 };
  edit = events.change(edit, '', 1);
  assert.equal(edit.text, '밥먹기');
  edit = events.change(edit, '밥먹', 2);
  assert.equal(edit.text, '밥먹');
  edit = events.change(edit, '밥', 3);
  edit = events.change(edit, '', 4);
  assert.equal(edit.text, '');
});

test('deleting the start of a restored chip keeps later chips unchanged', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '밥먹기,,운동', index: 1 }, '', 1);
  edit = events.change(edit, '먹기', 2);
  assert.equal(edit.text, '먹기,운동');
});

test('old native buffer edits after a merge retain the preceding chip exactly once', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '밥먹기,운동', index: 1 }, '운동', 1);
  edit = events.change(edit, '운', 2);
  assert.equal(edit.text, '밥먹기운');
  edit = events.change(edit, '밥먹기', 3);
  assert.equal(edit.text, '밥먹기');
});

test('backspace at a later chip keeps the native boundary while deleting restored text', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '회의,밥먹기,', index: 2 }, '', 1);
  edit = events.change(edit, boundary + '밥먹', 2);
  assert.equal(edit.text, '회의,밥먹');
  assert.equal(edit.index, 1);
});

test('enter and pasted line endings behave exactly like commas in the middle of a chip', () => {
  for (const separator of ['\n', '\r\n', '\r']) {
    const initial = { text: '회의장보기,운동', index: 0 };
    const actual = new NoteInputEvents().change(initial, '회의' + separator + '장보기', 1);
    const expected = new NoteInputEvents().change(initial, '회의,장보기', 1);
    assert.deepEqual(actual, expected);
    assert.equal(actual.caret, 0);
  }
});

test('fast typing after enter ignores duplicate native events and preserves each chip once', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '회의', index: 0 }, '회의\n', 1);
  assert.equal(events.change(edit, '회의\n', 2), null);
  edit = events.change(edit, '회의\n장보기\n운동', 3);
  assert.equal(edit.text, '회의,장보기,운동');
  assert.equal(edit.index, 2);
});

test('backspace after enter merges the previous chip just like comma input', () => {
  const events = new NoteInputEvents();
  let edit = events.change({ text: '회의', index: 0 }, '회의\n', 1);
  events.acknowledge();
  edit = events.change(edit, '', 2);
  assert.equal(edit.text, '회의');
  assert.equal(edit.index, 0);
});
