const { assert, test } = require('../support/test.cjs');
const {
  ScheduleEditSession,
} = require('../../src/features/planner/services/ScheduleEditSession.ts');

test('ordinary typing does not allocate a chip snapshot or inspect unchanged entries', () => {
  const model = new ScheduleEditSession({
    note: Array.from({ length: 10000 }, (_, i) => '일정' + i).join(','),
    initialIndex: 5000,
  });
  const before = model.view();
  for (let count = 1; count <= 200; count++) {
    assert.equal(model.change('한글'.repeat((count % 100) + 1), count, 0).split, false);
    assert.equal(model.view(), before);
  }
  assert.equal(model.view().entries[4999], before.entries[4999]);
  assert.equal(model.view().entries[5001], before.entries[5001]);
});

test('inserting, splitting and deleting keep adjacent chip identities and metadata stable', () => {
  const model = new ScheduleEditSession({
    note: '회의,운동',
    noteImportant: [true, false],
    noteAlarms: [false, true],
    initialSlot: 1,
  });
  const first = model.view().entries[0];
  const last = model.view().entries[2];
  model.change('점심,산책', 1, 0);
  assert.equal(model.view().entries[0], first);
  assert.equal(model.view().entries.at(-1), last);
  const session = model.view().session;
  model.change('', 1, session);
  model.activate(0);
  assert.equal(model.serialize(), '회의,점심,운동');
  assert.equal(model.view().entries.at(-1), last);
  assert.equal(last.alarm, true);
});

test('invalid input, old native sessions and repeated events never change the accepted draft', () => {
  const model = new ScheduleEditSession({ note: '회의,운동', initialSlot: 1 });
  model.change('점심', 10, 0);
  assert.ok(model.change('가'.repeat(256), 11, 0).error);
  assert.equal(model.text(), '점심');
  model.change('점심,', 12, 0);
  assert.equal(model.change('점심,', 13, 0), null);
  model.change('산책', 1, 1);
  assert.equal(model.change('늦은 이벤트', 1, 1), null);
  assert.equal(model.serialize(), '회의,점심,산책,운동');
});

test('changing an inline alarm time clears the alarm in the immediate chip snapshot', () => {
  const model = new ScheduleEditSession({
    note: '회의,운동',
    noteTimes: ['13:00', null],
    noteAlarms: [true, false],
    initialIndex: 0,
  });
  model.change('14:00 회의', 1, 0);
  model.activate(1);
  assert.equal(model.view().entries[0].alarm, false);
});

test('pasting many empty separators does not create thousands of invisible chip entries', () => {
  const model = new ScheduleEditSession({ note: '회의,운동', initialSlot: 1 });
  model.change(', '.repeat(10000), 1, 0);
  assert.equal(model.view().entries.length, 3);
  assert.equal(model.serialize(), '회의,,운동');
});
