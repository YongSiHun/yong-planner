const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  authorizeScheduleAlarm,
  changeNotificationPreference,
  defaultNotificationPreferences,
  events,
  pending,
  platform,
  presented,
  state,
  useNotificationStore,
} = require('../support/notifications.cjs');

test('enabling today summary creates channels before requesting only alert permission', async () => {
  await changeNotificationPreference('summary', true);
  const promptIndex = events.findIndex((event) => event.type === 'permission');
  assert.ok(promptIndex > events.findIndex((event) => event.type === 'channel'));
  const request = events[promptIndex].request;
  assert.equal(request.ios.allowSound, false);
  assert.equal(request.ios.allowBadge, false);
  assert.equal(request.ios.allowCriticalAlerts, false);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  assert.equal(useNotificationStore.getState().preferences.summary, true);
  assert.equal(pending.size, 7);
  assert.equal(presented.size, 1);
  assert.equal(JSON.parse(state.storedPreferences).summary, true);
});

test('denied notification permission leaves settings and schedules unchanged', async () => {
  state.allowPrompt = false;
  await assert.rejects(changeNotificationPreference('summary', true), /알림 권한/);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
  assert.equal(useNotificationStore.getState().busy, false);
  assert.equal(state.storedPreferences, null);
  assert.equal(pending.size, 0);
});

test('iOS requests sound only when alarms are enabled and never requests exact alarm access', async () => {
  platform.OS = 'ios';
  await changeNotificationPreference('summary', true);
  await changeNotificationPreference('alarms', true);
  const requests = events
    .filter((event) => event.type === 'permission')
    .map((event) => event.request.ios);
  assert.deepEqual(
    requests.map((request) => request.allowSound),
    [false, true],
  );
  assert.ok(requests.every((request) => request.allowBadge === false));
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  assert.equal(
    events.some((event) => event.type === 'channel'),
    false,
  );
});

test('Android exact alarms require real approval and denied access is not saved as enabled', async () => {
  state.granted = true;
  useNotificationStore.setState({
    preferences: { ...defaultNotificationPreferences, summary: false, alarms: true },
  });
  state.allowExact = false;
  await assert.rejects(changeNotificationPreference('exact', true), /정확한 알람 권한/);
  assert.equal(useNotificationStore.getState().preferences.exact, false);
  state.allowExact = true;
  await changeNotificationPreference('exact', true);
  assert.equal(useNotificationStore.getState().preferences.exact, true);
  assert.equal(useNotificationStore.getState().permission.exact, true);
});

test('malformed device preferences fall back safely and cannot enable exact alarms alone', async () => {
  const {
    loadNotificationPreferences,
  } = require('../../src/features/notifications/data/preferences.ts');
  state.storedPreferences = '{';
  assert.deepEqual(await loadNotificationPreferences(), defaultNotificationPreferences);
  state.storedPreferences = JSON.stringify({
    summary: 'true',
    exact: true,
    alarms: false,
    lockScreen: false,
  });
  assert.deepEqual(await loadNotificationPreferences(), {
    ...defaultNotificationPreferences,
    lockScreen: false,
  });
});

test('saved display choices survive new defaults and missing choices use new defaults', async () => {
  const {
    loadNotificationPreferences,
  } = require('../../src/features/notifications/data/preferences.ts');
  state.storedPreferences = JSON.stringify({ summary: false, lockScreen: true });
  const saved = await loadNotificationPreferences();
  assert.equal(saved.summary, false);
  assert.equal(saved.lockScreen, true);
  state.storedPreferences = '{}';
  assert.deepEqual(await loadNotificationPreferences(), defaultNotificationPreferences);
});

test('concurrent display changes are saved in order without dropping either choice', async () => {
  await Promise.all([
    changeNotificationPreference('summary', true),
    changeNotificationPreference('lockScreen', true),
  ]);
  const preferences = useNotificationStore.getState().preferences;
  assert.equal(preferences.summary, true);
  assert.equal(preferences.lockScreen, true);
  assert.deepEqual(JSON.parse(state.storedPreferences), preferences);
  assert.equal(useNotificationStore.getState().busy, false);
});

test('a failed queued change does not discard the next setting', async () => {
  state.allowPrompt = false;
  const denied = assert.rejects(changeNotificationPreference('summary', true), /알림 권한/);
  const next = changeNotificationPreference('lockScreen', false);
  await Promise.all([denied, next]);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
  assert.equal(useNotificationStore.getState().preferences.lockScreen, false);
  assert.equal(useNotificationStore.getState().busy, false);
  assert.equal(useNotificationStore.getState().error, null);
});

test('alarm authorization and display changes share the same persistence queue', async () => {
  const storage = require('expo-sqlite/kv-store');
  const save = storage.setItem;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let writes = 0;
  storage.setItem = async (...args) => {
    if (++writes === 1) await gate;
    await save(...args);
  };
  try {
    const alarm = authorizeScheduleAlarm();
    await new Promise((resolve) => setImmediate(resolve));
    const display = changeNotificationPreference('lockScreen', true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writes, 1);
    release();
    await Promise.all([alarm, display]);
    const preferences = useNotificationStore.getState().preferences;
    assert.equal(preferences.alarms, true);
    assert.equal(preferences.lockScreen, true);
    assert.deepEqual(JSON.parse(state.storedPreferences), preferences);
  } finally {
    release();
    storage.setItem = save;
  }
});
