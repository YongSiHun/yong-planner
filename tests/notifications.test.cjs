require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../src/features/planner/services/note.ts');
const {
  buildNotificationPlan,
  MAX_PENDING_NOTIFICATIONS,
} = require('../src/features/notifications/services/plan.ts');
const {
  reconcileNotifications,
  notificationFingerprint,
} = require('../src/features/notifications/services/reconcile.ts');
const { defaultNotificationPreferences } = require('../src/features/notifications/types.ts');
const holidays = { isHoliday: () => false, getHolidayName: () => null };
const now = new Date(2026, 10, 8, 8, 0);
function seed() {
  let id = 0;

  const data = applyDailyNote(emptyData(), '2026-11-08', '09:10 회의,밥먹기,07:30 지난 일정', () =>
    String(++id),
  );
  data.dailyPlanItems[0].alarm = true;
  return data;
}
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
function portFixture() {
  const pending = new Map();
  const presented = new Map();
  const calls = [];
  const port = {
    pending: async () => [...pending].map(([id, fingerprint]) => ({ id, fingerprint })),
    presented: async () => [...presented].map(([id, fingerprint]) => ({ id, fingerprint })),
    cancel: async (id) => {
      calls.push(['cancel', id]);
      pending.delete(id);
    },
    dismiss: async (id) => {
      calls.push(['dismiss', id]);
      presented.delete(id);
    },
    schedule: async (item, fingerprint) => {
      calls.push(['schedule', item.id]);
      (item.at === null ? presented : pending).set(item.id, fingerprint);
    },
  };

  return { pending, presented, calls, port };
}
test('reconciliation changes only edited schedules, clears disabled summaries and preserves unrelated notifications', async () => {
  const fixture = portFixture();
  fixture.pending.set('unrelated', 'keep');
  const prefs = { ...defaultNotificationPreferences, summary: true, alarms: true };
  const plan = buildNotificationPlan(seed(), prefs, now, holidays);
  await reconcileNotifications(fixture.port, plan, 'mode');
  const initial = fixture.calls.length;
  await reconcileNotifications(fixture.port, plan, 'mode');
  assert.equal(fixture.calls.length, initial);
  plan.pending.find((item) => item.kind === 'alarm').body = '수정한 회의';
  await reconcileNotifications(fixture.port, plan, 'mode');
  assert.equal(fixture.calls.length, initial + 2);
  await reconcileNotifications(
    fixture.port,
    { summary: null, pending: [], truncated: false },
    'mode',
  );
  assert.deepEqual([...fixture.pending.keys()], ['unrelated']);
  assert.equal(fixture.presented.size, 0);
});
test('reconciliation retries a partially failed schedule and fingerprints privacy and delivery settings', async () => {
  const fixture = portFixture();
  const plan = buildNotificationPlan(
    seed(),
    { ...defaultNotificationPreferences, summary: false, alarms: true },
    now,
    holidays,
  );
  const schedule = fixture.port.schedule;
  fixture.port.schedule = async () => {
    throw Error('native failure');
  };
  await assert.rejects(reconcileNotifications(fixture.port, plan, 'public'), /native failure/);
  fixture.port.schedule = schedule;
  await reconcileNotifications(fixture.port, plan, 'public');
  assert.equal(fixture.pending.size, 1);
  assert.notEqual(
    notificationFingerprint(plan.pending[0], 'public'),
    notificationFingerprint(plan.pending[0], 'hidden'),
  );
  await reconcileNotifications(fixture.port, plan, 'hidden');
  assert.equal(fixture.pending.size, 1);
});

test('failed native batches finish outstanding requests before returning an error', async () => {
  const fixture = portFixture();
  const first = buildNotificationPlan(
    seed(),
    { ...defaultNotificationPreferences, summary: false, alarms: true },
    now,
    holidays,
  ).pending[0];
  const second = { ...first, id: first.id + '-second' };
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  fixture.port.schedule = async (item) => {
    if (item.id === first.id) throw Error('failed');
    await blocked;
  };
  let settled = false;
  const result = reconcileNotifications(
    fixture.port,
    { summary: null, pending: [first, second], truncated: false },
    'mode',
  ).then(
    () => {
      settled = true;
    },
    (error) => {
      settled = true;
      throw error;
    },
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  release();
  await assert.rejects(result, /failed/);
});

test('only opted-in chips ring and disabling one cancels only that reservation', async () => {
  const data = seed();
  data.dailyPlanItems.push({
    ...data.dailyPlanItems[0],
    id: 'other',
    content: '선택 안 함',
    alarm: undefined,
  });
  const prefs = { ...defaultNotificationPreferences, summary: false, alarms: true };
  const initial = buildNotificationPlan(data, prefs, now, holidays);
  assert.equal(initial.pending.length, 1);
  const fixture = portFixture();
  await reconcileNotifications(fixture.port, initial, 'mode');
  data.dailyPlanItems[0].alarm = false;
  await reconcileNotifications(
    fixture.port,
    buildNotificationPlan(data, prefs, now, holidays),
    'mode',
  );
  assert.equal(fixture.pending.size, 0);
});

test('default display includes summaries and keeps lock screen hidden', () => {
  assert.equal(defaultNotificationPreferences.summary, true);
  assert.equal(defaultNotificationPreferences.lockScreen, false);
  const plan = buildNotificationPlan(seed(), defaultNotificationPreferences, now, holidays);
  assert.ok(plan.summary);
  assert.equal(plan.pending.filter((item) => item.kind === 'summary').length, 7);
  assert.equal(plan.pending.filter((item) => item.kind === 'alarm').length, 0);
});
