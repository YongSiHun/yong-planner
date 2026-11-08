require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { monthSelection } = require('../src/features/planner/services/monthSelection.ts');
const { scheduleLengthError, noteLengthError } = require('../src/services/schedule.ts');
const { NoteInputEvents } = require('../src/features/planner/services/noteInputEvents.ts');

test('year and month accept only supported integer text', () => {
  assert.equal(monthSelection('1', '1').date, '0001-01-01');
  assert.equal(monthSelection('9999', '12').date, '9999-12-01');
  for (const value of ['', '0', '-1', '10000', '1.5', '1e2', ' 2026', 'abc']) {
    assert.equal(monthSelection(value, '1').date, null);
    assert.ok(monthSelection(value, '1').yearError);
  }
  for (const value of ['', '0', '-1', '13', '1.5', '1e1', ' 1', 'abc']) {
    assert.equal(monthSelection('2026', value).date, null);
    assert.ok(monthSelection('2026', value).monthError);
  }
});

test('255-character limit counts Korean and emoji per schedule rather than per day', () => {
  assert.equal(scheduleLengthError('가'.repeat(255)), null);
  assert.equal(scheduleLengthError('😀'.repeat(255)), null);
  assert.ok(scheduleLengthError('가'.repeat(256)));
  assert.ok(scheduleLengthError('😀'.repeat(256)));
  assert.equal(noteLengthError('가'.repeat(255) + ',' + '나'.repeat(255)), null);
  assert.ok(noteLengthError('정상,' + '가'.repeat(256)));
});

test('oversized typing and pasted chips are rejected with a toast message without changing notes', () => {
  const notices = [];
  const events = new NoteInputEvents((message) => notices.push(message));
  const edit = { text: '가'.repeat(255), index: 0 };
  assert.equal(events.change(edit, edit.text + '나', 1), null);
  assert.equal(events.change(edit, '정상,' + '나'.repeat(256), 2), null);
  assert.equal(notices.length, 2);
  const next = events.change(edit, '가'.repeat(254), 3);
  assert.equal(next.text.length, 254);
});
