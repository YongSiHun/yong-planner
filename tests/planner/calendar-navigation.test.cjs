const assert = require('node:assert/strict');
const { test } = require('node:test');
const { state, MonthPicker, DayDate, find } = require('../support/planner.cjs');

test('date navigation wraps months, preserves the year and blocks invalid values', () => {
  const choices = [];
  const render = () => {
    state.cursor = 0;
    return MonthPicker({
      month: '2026-11-07',
      onClose() {},
      onChoose: (date) => choices.push(date),
    });
  };
  const field = (picker, unit) => {
    const node = find(
      picker,
      (node) => node.type?.name === 'NumberField' && node.props.unit === unit,
    );
    return node.type(node.props);
  };
  let picker = render();
  find(field(picker, '년'), (node) => node.type === 'Input').props.onChangeText('2030');
  picker = render();
  find(field(picker, '월'), (node) => node.type === 'Input').props.onChangeText('2');
  picker = render();
  picker.props.footer.props.onPress();
  assert.deepEqual(choices, ['2030-02-01']);
  find(field(picker, '월'), (node) => node.props?.accessibilityLabel === '다음 월').props.onPress();
  picker = render();
  assert.equal(find(field(picker, '월'), (node) => node.type === 'Input').props.value, '3');
  find(field(picker, '월'), (node) => node.type === 'Input').props.onChangeText('12');
  picker = render();
  const plus = find(field(picker, '월'), (node) => node.props?.accessibilityLabel === '다음 월');
  assert.equal(plus.props.disabled, false);
  plus.props.onPress();
  picker = render();
  assert.equal(find(field(picker, '월'), (node) => node.type === 'Input').props.value, '1');
  const minus = find(field(picker, '월'), (node) => node.props?.accessibilityLabel === '이전 월');
  assert.equal(minus.props.disabled, false);
  minus.props.onPress();
  picker = render();
  assert.equal(find(field(picker, '월'), (node) => node.type === 'Input').props.value, '12');
  assert.equal(find(field(picker, '년'), (node) => node.type === 'Input').props.value, '2030');
  assert.equal(picker.props.title, '날짜 이동');
  find(field(picker, '월'), (node) => node.type === 'Input').props.onChangeText('13');
  picker = render();
  assert.equal(picker.props.footer.props.disabled, true);
  assert.ok(
    find(
      field(picker, '월'),
      (node) => node.type === 'Label' && node.props.children?.includes?.('1~12'),
    ),
  );
  picker.props.footer.props.onPress();
  assert.equal(choices.length, 1);
  find(field(picker, '년'), (node) => node.type === 'Input').props.onChangeText('0');
  assert.equal(render().props.footer.props.disabled, true);
});

test('marked dates open date information and copy mode keeps date selection priority', () => {
  const calls = [];
  const props = {
    date: '2026-01-01',
    holidayName: '신정',
    isToday: false,
    copying: false,
    copyTarget: false,
    copySource: false,
    onCopyDate: (date) => calls.push(date),
    onFinish() {},
    onInfo: () => calls.push('info'),
  };
  const badge = DayDate(props);
  assert.match(badge.props.accessibilityLabel, /신정/);
  badge.props.onPress();
  assert.deepEqual(calls, ['info']);
  const dot = find(badge, (node) => node.type?.name === 'DateDot');
  assert.equal(dot.props.visible, true);
  calls.length = 0;
  DayDate({ ...props, copying: true }).props.onPress();
  assert.deepEqual(calls, ['2026-01-01']);
  calls.length = 0;
  DayDate({ ...props, holidayName: null }).props.onPress();
  assert.deepEqual(calls, []);
});
