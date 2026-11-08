require('./register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { emptyData } = require('../src/features/planner/types/index.ts');
const { defaultNotificationPreferences } = require('../src/features/notifications/types.ts');
const { today } = require('../src/utils/date.ts');
let granted;
let exact;
let sound;
let allowPrompt;
let allowExact;
let storedPreferences;
const events = [];
const pending = new Map();
const presented = new Map();
const platform = { OS: 'android' };
function mock(id, exports) {
  const filename = require.resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
function permissions() {
  return {
    granted,
    status: granted ? 'granted' : 'denied',
    canAskAgain: true,
    ios: platform.OS === 'ios' ? { allowsSound: sound } : undefined,
  };
}
mock('react-native', {
  Platform: platform,
  Linking: { openSettings: async () => events.push('settings') },
});
mock('expo-sqlite/kv-store', {
  getItem: async () => storedPreferences,
  setItem: async (_key, value) => {
    storedPreferences = value;
  },
});
mock('expo-notifications', {
  AndroidImportance: { LOW: 4, HIGH: 6 },
  AndroidNotificationVisibility: { PUBLIC: 1, SECRET: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationChannelAsync: async (id, config) => {
    events.push({ type: 'channel', id, config });
  },
  getPermissionsAsync: async () => permissions(),
  getExactAlarmPermissionsAsync: async () => ({ granted: exact, canAskAgain: true }),
  requestPermissionsAsync: async (request) => {
    events.push({ type: 'permission', request });
    granted = allowPrompt;
    sound = request.ios.allowSound;
    return permissions();
  },
  requestExactAlarmPermissionsAsync: async () => {
    events.push({ type: 'exact' });
    exact = allowExact;
    return { granted: exact };
  },
  setNotificationHandler: (handler) => {
    events.push({ type: 'handler', handler });
  },
  getAllScheduledNotificationsAsync: async () => {
    events.push({ type: 'pending' });
    return [...pending.values()];
  },
  getPresentedNotificationsAsync: async () =>
    [...presented.values()].map((request) => ({ request })),
  cancelScheduledNotificationAsync: async (id) => {
    pending.delete(id);
  },
  dismissNotificationAsync: async (id) => {
    presented.delete(id);
  },
  scheduleNotificationAsync: async (request) => {
    const scheduled = request.trigger?.type === 'date';
    (scheduled ? pending : presented).set(request.identifier, request);
    return request.identifier;
  },
});
const { usePlanner } = require('../src/stores/planner.ts');
const { useNotificationStore } = require('../src/stores/notifications.ts');
const {
  initializeNotifications,
  changeNotificationPreference,
  syncNotifications,
  startNotificationSync,
  requestStartupNotificationPermission,
  authorizeScheduleAlarm,
} = require('../src/features/notifications/controllers/notifications.ts');
beforeEach(() => {
  granted = false;
  exact = false;
  sound = false;
  allowPrompt = true;
  allowExact = true;
  storedPreferences = null;
  events.length = 0;
  pending.clear();
  presented.clear();
  platform.OS = 'android';
  usePlanner.setState({ ready: true, restoring: false, data: emptyData() });
  useNotificationStore.setState({
    ready: true,
    busy: false,
    preferences: { ...defaultNotificationPreferences },
    permission: null,
    error: null,
    count: 0,
    truncated: false,
  });
});
test('initialization never requests notification or exact alarm permission', async () => {
  useNotificationStore.setState({ ready: false });
  await initializeNotifications();
  assert.equal(events.length, 0);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
});
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
  assert.equal(JSON.parse(storedPreferences).summary, true);
});
test('denied notification permission leaves settings and schedules unchanged', async () => {
  allowPrompt = false;
  await assert.rejects(changeNotificationPreference('summary', true), /알림 권한/);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
  assert.equal(useNotificationStore.getState().busy, false);
  assert.equal(storedPreferences, null);
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
  granted = true;
  useNotificationStore.setState({
    preferences: { ...defaultNotificationPreferences, alarms: true },
  });
  allowExact = false;
  await assert.rejects(changeNotificationPreference('exact', true), /정확한 알람 권한/);
  assert.equal(useNotificationStore.getState().preferences.exact, false);
  allowExact = true;
  await changeNotificationPreference('exact', true);
  assert.equal(useNotificationStore.getState().preferences.exact, true);
  assert.equal(useNotificationStore.getState().permission.exact, true);
});
test('revoked permission cancels owned reservations and current summary', async () => {
  await changeNotificationPreference('summary', true);
  granted = false;
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
  granted = true;
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

test('native alarm requests use canonical times and fall back when exact access is revoked', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { dateKey } = require('../src/utils/date.ts');
  const data = emptyData();
  data.settings.timeFormat = '12h';
  data.dailyPlanItems = [
    {
      id: 'alarm',
      alarm: true,
      date: dateKey(tomorrow),
      content: '회의',
      time: '13:10',
      createdAt: new Date().toISOString(),
    },
  ];
  usePlanner.setState({ data });
  granted = true;
  exact = true;
  useNotificationStore.setState({
    preferences: { ...defaultNotificationPreferences, alarms: true, exact: true },
  });
  await syncNotifications();
  let request = [...pending.values()][0];
  assert.equal(request.trigger.delivery, 'alarmClock');
  assert.equal(new Date(request.trigger.date).getHours(), 13);
  assert.equal(new Date(request.trigger.date).getMinutes(), 10);
  assert.equal(request.content.body, '오후 1시 10분 회의');
  assert.equal(request.content.sound, true);
  const handler = events.find((event) => event.type === 'handler').handler;
  assert.equal((await handler.handleNotification({ request })).shouldPlaySound, true);
  assert.equal(
    (await handler.handleNotification({ request: { content: { data: { kind: 'summary' } } } }))
      .shouldShowBanner,
    false,
  );
  exact = false;
  await syncNotifications();
  request = [...pending.values()][0];
  assert.equal(request.trigger.delivery, 'bestEffort');
  assert.equal(pending.size, 1);
});
test('malformed device preferences fall back safely and cannot enable exact alarms alone', async () => {
  const {
    loadNotificationPreferences,
  } = require('../src/features/notifications/data/preferences.ts');
  storedPreferences = '{';
  assert.deepEqual(await loadNotificationPreferences(), defaultNotificationPreferences);
  storedPreferences = JSON.stringify({
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

test('app startup requests alert and sound once without exact access or enabling display', async () => {
  await Promise.all([
    requestStartupNotificationPermission(),
    requestStartupNotificationPermission(),
  ]);
  assert.equal(events.filter((event) => event.type === 'permission').length, 1);
  assert.equal(events.find((event) => event.type === 'permission').request.ios.allowSound, true);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  assert.equal(useNotificationStore.getState().preferences.summary, false);
});

test('chip alarm setup requests required access and denied notifications stop setup', async () => {
  allowPrompt = false;
  await assert.rejects(authorizeScheduleAlarm(), /알림 권한/);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  allowPrompt = true;
  await authorizeScheduleAlarm();
  assert.equal(useNotificationStore.getState().preferences.alarms, true);
  assert.equal(useNotificationStore.getState().permission.exact, true);
  const prompts = events.filter((event) => event.type === 'permission').length;
  const exacts = events.filter((event) => event.type === 'exact').length;
  await authorizeScheduleAlarm();
  assert.equal(events.filter((event) => event.type === 'permission').length, prompts);
  assert.equal(events.filter((event) => event.type === 'exact').length, exacts);
});

test('alarm channels use the SDK default instead of resolving a custom default sound file', async () => {
  await authorizeScheduleAlarm();
  const channels = events.filter((event) => event.type === 'channel');
  const alarm = channels.find((event) => event.id.includes('-alarm-'));
  const summary = channels.find((event) => event.id.includes('-summary-'));
  assert.equal(Object.hasOwn(alarm.config, 'sound'), false);
  assert.equal(summary.config.sound, null);
});
