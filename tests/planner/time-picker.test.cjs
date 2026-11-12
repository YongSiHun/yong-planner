const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  React,
  SelectionBar,
  applyDailyNote,
  find,
  renderSelection,
  state,
} = require('../support/planner.cjs');

test('12-hour time picker selects AM/PM for all selected schedules and clamps invalid values', () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  const savedTimes = [];
  const render = () => {
    state.cursor = 0;
    return TimePicker({
      item: { id: 'a', content: '회의', time: '09:00' },
      count: 2,
      format: '12h',
      onClose() {},
      onSave: (time) => savedTimes.push(time),
    });
  };
  let picker = render();
  find(picker, (node) => node.type === 'Button' && node.props.title === '오후').props.onPress();
  picker = render();
  find(picker, (node) => node.props?.accessibilityLabel === '시').props.onChangeText('13');
  picker = render();
  assert.equal(find(picker, (node) => node.props?.accessibilityLabel === '시').props.value, '12');
  find(picker, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('60');
  picker = render();
  find(
    picker.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(savedTimes, ['12:59']);
  find(picker, (node) => node.type === 'Button' && node.props.title === '오전').props.onPress();
  find(
    render().props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(savedTimes, ['12:59', '00:59']);
});

test('time modal applies mixed selected times without an overwrite notice', () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  let id = 0;
  state.plannerData = applyDailyNote(
    state.plannerData,
    '2026-11-08',
    '13:00 회의,14:00 운동,독서',
    () => 'overwrite-' + ++id,
  );
  renderSelection().toggle('2026-11-08', 0, true);
  renderSelection().toggle('2026-11-08', 1);
  renderSelection().openTime();
  const selection = renderSelection();
  const bar = SelectionBar({ count: 2, onTime: selection.openTime });
  const timeButton = find(
    bar,
    (node) => node.type?.name === 'SheetAction' && node.props.title === '시간 설정',
  );
  assert.notEqual(timeButton.props.disabled, true);
  state.slots = [];
  state.cursor = 0;
  const dialog = TimePicker({
    item: selection.timeSource,
    format: '24h',
    count: 2,
    hasExistingTime: true,
    onClose: selection.closeTime,
    onSave: selection.saveTime,
  });
  assert.equal(
    find(dialog.props.footer, (node) => node.type === 'Button' && node.props.title === '적용').props
      .title,
    '적용',
  );
  assert.equal(state.plannerData.dailyPlanItems[1].time, '14:00');
  find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  ).props.onPress();
  assert.deepEqual(
    state.plannerData.dailyPlanItems.map((item) => item.time ?? null),
    ['13:00', '13:00', null],
  );
});

test('time clearing appears in the footer with the same typography as apply', () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  const saved = [];
  state.cursor = 0;
  const dialog = TimePicker({
    item: { id: 'a', content: '회의', time: '13:00' },
    format: '24h',
    onClose() {},
    onSave: (time) => saved.push(time),
  });
  const remove = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '시간 지우기',
  );
  const apply = find(
    dialog.props.footer,
    (node) => node.type === 'Button' && node.props.title === '적용',
  );
  assert.equal(remove.props.bold, apply.props.bold);
  assert.equal(remove.props.style, apply.props.style);
  assert.equal(
    find(dialog, (node) => node.type === 'Button' && node.props.title === '시간 지우기'),
    undefined,
  );
  remove.props.onPress();
  assert.deepEqual(saved, [null]);
});

test('time and alarm dialogs keep controls fixed and scroll only the schedule preview', () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  const items = Array.from({ length: 8 }, (_, index) => ({
    id: 'layout-' + index,
    content: '일정 ' + index,
    time: '13:00',
  }));
  for (const format of ['12h', '24h']) {
    const dialogs = ['시간 설정', '알람 설정'].map((title) => {
      state.slots = [];
      state.cursor = 0;
      return TimePicker({
        title,
        item: items[0],
        items,
        count: items.length,
        format,
        onClose() {},
        onSave() {},
      });
    });
    for (const dialog of dialogs) {
      assert.equal(dialog.props.scrollable, false);
      assert.equal(dialog.props.height, undefined);
      const [preview, controls] = React.Children.toArray(dialog.props.children);
      assert.deepEqual(
        preview.props.style,
        React.Children.toArray(dialogs[0].props.children)[0].props.style,
      );
      const list = find(preview, (node) => node.type === 'ScrollView');
      assert.ok(list);
      assert.ok(list.props.style.maxHeight > 0);
      assert.equal(list.props.style.height, undefined);
      assert.equal(
        find(list, (node) => node.props?.accessibilityLabel === '시'),
        undefined,
      );
      assert.ok(find(controls, (node) => node.props?.accessibilityLabel === '시'));
      assert.ok(find(controls, (node) => node.props?.accessibilityLabel === '분'));
      assert.ok(
        find(
          list,
          (node) => node.type === 'Label' && String(node.props.children).includes('13시 일정 7'),
        ) ||
          find(
            list,
            (node) =>
              node.type === 'Label' && String(node.props.children).includes('오후 1시 일정 7'),
          ),
      );
      assert.equal(
        find(controls, (node) => node.type === 'ScrollView'),
        undefined,
      );
    }
  }
});

test('time modal warns below the title only when the chosen time would clear an existing alarm', () => {
  const { TimePicker } = require('../../src/features/planner/components/TimePicker.tsx');
  const { light } = require('../../src/components/ui/palette.ts');
  const items = [
    { id: 'a', content: '회의', time: '13:00', alarm: true },
    { id: 'b', content: '식사', time: '14:00' },
  ];
  const render = (alarmSetting = false) => {
    state.cursor = 0;
    return TimePicker({
      item: items[0],
      items,
      count: 2,
      format: '24h',
      alarmSetting,
      onClose() {},
      onSave() {},
    });
  };
  let dialog = render();
  assert.equal(dialog.props.headerNotice, null);
  find(dialog, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('30');
  dialog = render();
  const notice = dialog.props.headerNotice;
  assert.equal(notice.props.children, '알람이 설정된 일정은 알람이 해제돼요');
  assert.equal(notice.props.style.color, light.red);
  assert.equal(notice.props.style.fontSize, 13);
  assert.equal(dialog.props.scrollable, false);
  const alarmNotice = render(true).props.headerNotice;
  assert.equal(alarmNotice.props.children, '설정한 시간으로 알람이 일괄로 설정돼요');
  assert.deepEqual(alarmNotice.props.style, notice.props.style);
  find(dialog, (node) => node.props?.accessibilityLabel === '분').props.onChangeText('00');
  assert.equal(render().props.headerNotice, null);
});
