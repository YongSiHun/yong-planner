require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  holidayDateSelection,
  holidayNameError,
} = require('../../src/features/settings/services/holidayValidation.ts');

test('holiday dates normalize editable fields and enforce leap years and supported year boundaries', () => {
  for (const [input, date] of [
    ['1-1-1', '0001-01-01'],
    ['9999-12-31', '9999-12-31'],
    ['2028-2-29', '2028-02-29'],
    ['2000-2-29', '2000-02-29'],
    ['2026-11-2', '2026-11-02'],
  ])
    assert.deepEqual(holidayDateSelection(input), { date, error: null });
  for (const input of [
    '',
    '--',
    '2026--1',
    '2026-1-',
    '0-1-1',
    '10000-1-1',
    '2026-0-1',
    '2026-13-1',
    '2026-1-0',
    '2026-1-32',
    '2026-2-29',
    '1900-2-29',
    '2026-4-31',
    '2026-1.2-1',
    '2026-1-1e1',
    '2026-1-1-extra',
  ]) {
    const result = holidayDateSelection(input);
    assert.equal(result.date, null, input);
    assert.ok(result.error, input);
  }
});

test('holiday names allow an empty removal marker and limit Korean and emoji by code point', () => {
  for (const name of ['', '임시공휴일', '가'.repeat(255), '😀'.repeat(255)]) {
    assert.equal(holidayNameError(name), null);
  }
  for (const name of [' ', '\t\n', '가'.repeat(256), '😀'.repeat(256)]) {
    assert.ok(holidayNameError(name));
  }
});
