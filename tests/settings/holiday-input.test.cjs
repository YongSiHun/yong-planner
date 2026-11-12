const assert = require('node:assert/strict');
const { test } = require('node:test');
const { state, find } = require('../support/planner.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const mock = createModuleMock(require);
const saves = [];
mock('../../src/features/planner/hooks/usePlannerActions.ts', {
  usePlannerActions: () => ({
    saveHolidayOverride: (...args) => saves.push(args),
    removeHolidayOverride() {},
  }),
});
const { HolidayDateInput } = require('../../src/features/settings/components/HolidayDateInput.tsx');
const { HolidayOverrides } = require('../../src/features/settings/components/HolidayOverrides.tsx');

function render() {
  state.cursor = 0;
  return HolidayOverrides();
}
function editor() {
  return find(render(), (node) => node.type === 'Dialog');
}

test('holiday date editing retains other fields and rejects decimals and letters instead of changing their meaning', () => {
  let date = '2026-11-12';
  const input = (label) =>
    find(
      HolidayDateInput({
        date,
        onChange: (value) => {
          date = value;
        },
      }),
      (node) => node.props?.accessibilityLabel === label,
    );
  input('보정 날짜 월').props.onChangeText('');
  assert.equal(date, '2026--12');
  input('보정 날짜 월').props.onChangeText('2');
  input('보정 날짜 월').props.onBlur();
  assert.equal(date, '2026-02-12');
  input('보정 날짜 월').props.onChangeText('1.2');
  input('보정 날짜 연도').props.onChangeText('abcd');
  assert.equal(date, '2026-02-12');
});

test('invalid holidays cannot save and a one-digit edited day saves canonically without waiting for blur', () => {
  saves.length = 0;
  find(render(), (node) => node.props?.title === '+ 공휴일 보정 추가').props.onPress();
  const dateInput = () => find(editor(), (node) => node.type === HolidayDateInput);
  dateInput().props.onChange('2026-02-30');
  assert.equal(editor().props.footer.props.disabled, true);
  editor().props.footer.props.onPress();
  assert.equal(saves.length, 0);
  assert.ok(editor());
  dateInput().props.onChange('2026-02-2');
  assert.equal(editor().props.footer.props.disabled, false);
  editor().props.footer.props.onPress();
  assert.deepEqual(saves, [['2026-02-02', '']]);
  assert.equal(editor(), undefined);
});
