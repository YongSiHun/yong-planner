const { assert, test } = require('../support/test.cjs');
const { monthSelection } = require('../../src/features/planner/services/monthSelection.ts');
const { scheduleLengthError, noteLengthError } = require('../../src/services/schedule.ts');

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

test('schedule length checks stop at the first overflowing code point', () => {
  let read = 0;
  const input = {
    *[Symbol.iterator]() {
      while (true) {
        read++;
        if (read > 256) throw new Error('scanned past overflow');
        yield '😀';
      }
    },
  };
  assert.ok(scheduleLengthError(input));
  assert.equal(read, 256);
});
