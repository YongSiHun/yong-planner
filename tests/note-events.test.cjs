require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NoteInputEvents } = require('../src/features/planner/services/noteInputEvents.ts');
const { NOTE_INPUT_BOUNDARY: boundary } = require('../src/features/planner/services/note.ts');

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
