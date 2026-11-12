const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  events,
  freshStartupRequest,
  initializeNotifications,
  platform,
  requestStartupNotificationPermission,
  state,
  useNotificationStore,
} = require('../support/notifications.cjs');

test('initialization never requests notification or exact alarm permission', async () => {
  useNotificationStore.setState({ ready: false });
  await initializeNotifications();
  assert.equal(events.length, 0);
  assert.equal(useNotificationStore.getState().preferences.summary, true);
  assert.equal(useNotificationStore.getState().preferences.lockScreen, false);
});

test('Android startup requests notifications before exact alarms once without enabling display', async () => {
  await Promise.all([
    requestStartupNotificationPermission(),
    requestStartupNotificationPermission(),
  ]);
  assert.equal(events.filter((event) => event.type === 'permission').length, 1);
  assert.equal(events.find((event) => event.type === 'permission').request.ios.allowSound, true);
  assert.equal(events.filter((event) => event.type === 'exact').length, 1);
  assert.ok(
    events.findIndex((event) => event.type === 'exact') >
      events.findIndex((event) => event.type === 'permission'),
  );
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
});

test('iOS startup requests alerts and sound without Android exact alarm access', async () => {
  platform.OS = 'ios';
  await freshStartupRequest()();
  assert.equal(events.filter((event) => event.type === 'permission').length, 1);
  assert.equal(events.find((event) => event.type === 'permission').request.ios.allowSound, true);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
});

test('startup skips granted permissions and stops exact access after notification denial', async () => {
  state.granted = true;
  state.exact = true;
  state.sound = true;
  await freshStartupRequest()();
  assert.equal(
    events.some((event) => ['permission', 'exact'].includes(event.type)),
    false,
  );
  state.granted = false;
  state.startupRequested = null;
  state.allowPrompt = false;
  await assert.rejects(freshStartupRequest()(), /알림 권한/);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
});

test('denied exact alarm access on startup keeps settings disabled without failing startup', async () => {
  state.allowExact = false;
  await freshStartupRequest()();
  assert.equal(useNotificationStore.getState().permission.granted, true);
  assert.equal(useNotificationStore.getState().permission.exact, false);
  assert.equal(useNotificationStore.getState().preferences.exact, false);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
});

test('startup denial is remembered across sessions without another prompt', async () => {
  const request = freshStartupRequest();
  state.allowPrompt = false;
  await assert.rejects(request(), /알림 권한/);
  state.allowPrompt = true;
  await assert.rejects(request(), /알림 권한/);
  await freshStartupRequest()();
  assert.equal(events.filter((event) => event.type === 'permission').length, 1);
});
