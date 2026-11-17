const { assert, test } = require('../support/test.cjs');
const { holidays, now, seed } = require('../support/notification-plan.cjs');
const { defaultNotificationPreferences } = require('../../src/features/notifications/types.ts');
const {
  buildNotificationPlan,
  MAX_PENDING_NOTIFICATIONS,
} = require('../../src/features/notifications/services/plan.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');

test('disabled notification planning never schedules untimed or past alarms', () => {
  const data = seed();
  assert.deepEqual(
    buildNotificationPlan(
      data,
      { ...defaultNotificationPreferences, summary: false },
      now,
      holidays,
    ),
    {
      summary: null,
      pending: [],
      truncated: false,
    },
  );
  const plan = buildNotificationPlan(
    data,
    { ...defaultNotificationPreferences, summary: false, alarms: true },
    now,
    holidays,
  );
  assert.equal(plan.pending.length, 1);
  assert.equal(plan.pending[0].body, '9시 10분 회의');
  assert.equal(new Date(plan.pending[0].at).getHours(), 9);
  assert.equal(new Date(plan.pending[0].at).getMinutes(), 10);
});

test('today and next seven days use schedule time format, alarm marks and recurring exceptions', () => {
  const data = seed();
  data.settings.timeFormat = '12h';
  data.dailyPlanItems[0].important = true;
  data.recurringPlans = [
    {
      id: 'r',
      title: '반복 일정',
      time: '13:10',
      startDate: '2026-11-01',
      endDate: null,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      holidayPolicy: 'include',
    },
  ];
  data.recurringPlanExceptions = [{ recurringPlanId: 'r', date: '2026-11-08', cancelled: true }];
  const plan = buildNotificationPlan(
    data,
    { ...defaultNotificationPreferences, summary: true, alarms: true },
    now,
    holidays,
  );
  assert.match(plan.summary.body, /⏰ 오전 9시 10분 회의/);
  assert.doesNotMatch(plan.summary.body, /반복 일정/);
  assert.equal(plan.pending.filter((item) => item.kind === 'summary').length, 7);
  const tomorrow = plan.pending.find((item) => item.kind === 'alarm' && item.date === '2026-11-09');
  assert.equal(tomorrow, undefined);
  const tomorrowSummary = plan.pending.find(
    (item) => item.kind === 'summary' && item.date === '2026-11-09',
  );
  assert.match(tomorrowSummary.body, /오후 1시 10분 반복 일정/);
});

test('OS pending limit keeps nearest alarms without duplicating stable IDs', () => {
  const data = emptyData();
  data.dailyPlanItems = Array.from({ length: 70 }, (_, index) => ({
    id: String(index),
    date: '2026-11-09',
    content: '일정 ' + index,
    time: '09:00',
    alarm: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  }));
  const plan = buildNotificationPlan(
    data,
    { ...defaultNotificationPreferences, summary: true, alarms: true },
    now,
    holidays,
  );
  assert.equal(plan.pending.length, MAX_PENDING_NOTIFICATIONS);
  assert.equal(plan.truncated, true);
  assert.equal(new Set(plan.pending.map((item) => item.id)).size, plan.pending.length);
  const alarms = plan.pending.filter((item) => item.kind === 'alarm');
  assert.equal(alarms.length, 53);
  assert.ok(alarms.every((item, index) => index === 0 || item.at >= alarms[index - 1].at));
});

test('planning at the last supported year does not generate invalid dates', () => {
  const plan = buildNotificationPlan(
    emptyData(),
    { ...defaultNotificationPreferences, summary: true },
    new Date(9999, 11, 31, 8),
    holidays,
  );
  assert.equal(plan.summary.date, '9999-12-31');
  assert.deepEqual(plan.pending, []);
});

test('default display includes summaries and keeps lock screen hidden', () => {
  assert.equal(defaultNotificationPreferences.summary, true);
  assert.equal(defaultNotificationPreferences.lockScreen, false);
  const plan = buildNotificationPlan(seed(), defaultNotificationPreferences, now, holidays);
  assert.ok(plan.summary);
  assert.equal(plan.pending.filter((item) => item.kind === 'summary').length, 7);
  assert.equal(plan.pending.filter((item) => item.kind === 'alarm').length, 0);
});

test('status bar summaries use commas and explicitly mark empty schedules as non-expandable', () => {
  const populated = buildNotificationPlan(
    seed(),
    defaultNotificationPreferences,
    now,
    holidays,
  ).summary;
  assert.equal(populated.hasSchedules, true);
  assert.ok(populated.body.includes(', '));
  assert.ok(!populated.body.includes('\n'));
  const empty = buildNotificationPlan(
    emptyData(),
    defaultNotificationPreferences,
    now,
    holidays,
  ).summary;
  assert.equal(empty.hasSchedules, false);
  assert.equal(empty.body, '등록된 일정이 없어요.');
});
