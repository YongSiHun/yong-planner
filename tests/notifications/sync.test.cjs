const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  changeNotificationPreference,
  defaultNotificationPreferences,
  emptyData,
  events,
  pending,
  presented,
  startNotificationSync,
  state,
  syncNotifications,
  today,
  useNotificationStore,
  usePlanner,
} = require('../support/notifications.cjs');

test('revoked permission cancels owned reservations and current summary', async () => {
  await changeNotificationPreference('summary', true);
  state.granted = false;
  await syncNotifications();
  assert.equal(pending.size, 0);
  assert.equal(presented.size, 0);
  assert.equal(useNotificationStore.getState().permission.granted, false);
});

test('changing lock screen visibility switches to a separate hidden channel', async () => {
  await changeNotificationPreference('summary', true);
  await changeNotificationPreference('lockScreen', false);
  assert.ok(
    events.some(
      (event) =>
        event.type === 'channel' &&
        event.id.includes('hidden') &&
        event.config.lockscreenVisibility === 3,
    ),
  );
  assert.ok([...pending.values()].every((request) => request.trigger.channelId.includes('hidden')));
});

test('rapid planner edits debounce into one synchronization without UI subscriptions', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  state.granted = true;
  useNotificationStore.setState({
    preferences: { ...defaultNotificationPreferences, summary: true },
  });
  const stop = startNotificationSync();
  try {
    await new Promise((resolve) => setImmediate(resolve));
    const first = {
      ...emptyData(),
      dailyPlanItems: [
        { id: 'a', date: today(), content: '첫 입력', createdAt: new Date().toISOString() },
      ],
    };
    usePlanner.setState({ data: first });
    usePlanner.setState({
      data: { ...first, dailyPlanItems: [{ ...first.dailyPlanItems[0], content: '마지막 입력' }] },
    });
    context.mock.timers.tick(1000);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(events.filter((event) => event.type === 'pending').length, 1);
    assert.match([...presented.values()][0].content.body, /마지막 입력/);
  } finally {
    stop();
    context.mock.timers.reset();
  }
});

test('stopping sync before initialization settles leaves no delayed synchronization', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  useNotificationStore.setState({ preferences: { ...defaultNotificationPreferences } });
  state.granted = true;
  const stop = startNotificationSync();
  stop();
  await new Promise((resolve) => setImmediate(resolve));
  context.mock.timers.tick(2000);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events.length, 0);
  context.mock.timers.reset();
});

test('removed lock screen choice does not enable status bar notifications', async () => {
  await changeNotificationPreference('lockScreen', true);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
  assert.equal(useNotificationStore.getState().preferences.lockScreen, false);
  assert.equal(pending.size, 0);
  assert.equal(presented.size, 0);
  state.granted = false;
  await syncNotifications();
  assert.equal(pending.size, 0);
  assert.equal(presented.size, 0);
});
