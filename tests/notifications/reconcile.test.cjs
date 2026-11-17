const { assert, test } = require('../support/test.cjs');
const { holidays, now, seed } = require('../support/notification-plan.cjs');
const { defaultNotificationPreferences } = require('../../src/features/notifications/types.ts');
const { buildNotificationPlan } = require('../../src/features/notifications/services/plan.ts');
const {
  reconcileNotifications,
  notificationFingerprint,
} = require('../../src/features/notifications/services/reconcile.ts');

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
