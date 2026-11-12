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
let startupRequested;
let acceptPermission = true;
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
  Alert: { alert: (_title, _message, buttons) => buttons[acceptPermission ? 1 : 0].onPress() },
  Linking: { openSettings: async () => events.push('settings') },
});
mock('expo-sqlite/kv-store', {
  getItem: async (key) =>
    key === 'notification-startup-requested-v1' ? startupRequested : storedPreferences,
  setItem: async (key, value) => {
    if (key === 'notification-startup-requested-v1') {
      startupRequested = value;
      return;
    }
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
mock('../src/features/planner/controllers/persistence.ts', {
  updatePlanner: (change) => usePlanner.setState({ data: change(usePlanner.getState().data) }),
  flushPlanner: async () => {
    events.push('flush-planner');
  },
});
const {
  clearScheduleAlarms,
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
  startupRequested = null;
  acceptPermission = true;
  events.length = 0;
  pending.clear();
  presented.clear();
  platform.OS = 'android';
  usePlanner.setState({ ready: true, restoring: false, data: emptyData() });
  useNotificationStore.setState({
    ready: true,
    busy: false,
    preferences: { ...defaultNotificationPreferences, summary: false },
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
  assert.equal(useNotificationStore.getState().preferences.summary, true);
  assert.equal(useNotificationStore.getState().preferences.lockScreen, false);
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
    preferences: { ...defaultNotificationPreferences, summary: false, alarms: true },
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
    preferences: { ...defaultNotificationPreferences, summary: false, alarms: true, exact: true },
  });
  await syncNotifications();
  let request = [...pending.values()][0];
  assert.equal(request.trigger.delivery, 'alarmClock');
  assert.equal(request.trigger.type, 'date');
  assert.equal(request.trigger.repeats, undefined);
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

function freshStartupRequest() {
  const filename = require.resolve('../src/features/notifications/controllers/notifications.ts');
  delete require.cache[filename];
  delete require.cache[
    require.resolve('../src/features/notifications/controllers/notificationPermissions.ts')
  ];
  return require(filename).requestStartupNotificationPermission;
}

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
  granted = true;
  exact = true;
  sound = true;
  await freshStartupRequest()();
  assert.equal(
    events.some((event) => ['permission', 'exact'].includes(event.type)),
    false,
  );
  granted = false;
  startupRequested = null;
  allowPrompt = false;
  await assert.rejects(freshStartupRequest()(), /알림 권한/);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
});

test('denied exact alarm access on startup keeps settings disabled without failing startup', async () => {
  allowExact = false;
  await freshStartupRequest()();
  assert.equal(useNotificationStore.getState().permission.granted, true);
  assert.equal(useNotificationStore.getState().permission.exact, false);
  assert.equal(useNotificationStore.getState().preferences.exact, false);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
});

test('saved display choices survive new defaults and missing choices use new defaults', async () => {
  const {
    loadNotificationPreferences,
  } = require('../src/features/notifications/data/preferences.ts');
  storedPreferences = JSON.stringify({ summary: false, lockScreen: true });
  const saved = await loadNotificationPreferences();
  assert.equal(saved.summary, false);
  assert.equal(saved.lockScreen, true);
  storedPreferences = '{}';
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
  assert.deepEqual(JSON.parse(storedPreferences), preferences);
  assert.equal(useNotificationStore.getState().busy, false);
});

test('startup denial is remembered across sessions without another prompt', async () => {
  const request = freshStartupRequest();
  allowPrompt = false;
  await assert.rejects(request(), /알림 권한/);
  allowPrompt = true;
  await assert.rejects(request(), /알림 권한/);
  await freshStartupRequest()();
  assert.equal(events.filter((event) => event.type === 'permission').length, 1);
});

test('stopping sync before initialization settles leaves no delayed synchronization', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  useNotificationStore.setState({ preferences: { ...defaultNotificationPreferences } });
  granted = true;
  const stop = startNotificationSync();
  stop();
  await new Promise((resolve) => setImmediate(resolve));
  context.mock.timers.tick(2000);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events.length, 0);
  context.mock.timers.reset();
});

test('a failed queued change does not discard the next setting', async () => {
  allowPrompt = false;
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
    assert.deepEqual(JSON.parse(storedPreferences), preferences);
  } finally {
    release();
    storage.setItem = save;
  }
});

test('clearing selected alarms cancels pending and delivered alarms while preserving times and other alarms', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { dateKey } = require('../src/utils/date.ts');
  const date = dateKey(tomorrow);
  const data = emptyData();
  data.dailyPlanItems = ['a:/한글', 'b'].map((id) => ({
    id,
    date,
    content: id,
    time: '13:10',
    alarm: true,
    createdAt: new Date().toISOString(),
  }));
  usePlanner.setState({ data });
  granted = true;
  await syncNotifications();
  const requests = [...pending.values()];
  requests.forEach((request) => presented.set(request.identifier, request));
  const removed = requests.find((request) =>
    request.identifier.endsWith(encodeURIComponent('daily:a:/한글')),
  );
  const kept = requests.find((request) => request !== removed);
  await clearScheduleAlarms(new Set(['a:/한글']));
  assert.equal(pending.has(removed.identifier), false);
  assert.equal(presented.has(removed.identifier), false);
  assert.equal(pending.has(kept.identifier), true);
  assert.equal(presented.has(kept.identifier), true);
  assert.deepEqual(
    usePlanner.getState().data.dailyPlanItems.map((item) => item.time),
    ['13:10', '13:10'],
  );
  assert.deepEqual(
    usePlanner.getState().data.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [false, true],
  );
  assert.ok(events.includes('flush-planner'));
});

test('clearing all alarms removes orphan reservations and delivered alarms while preserving summaries', async () => {
  granted = true;
  await changeNotificationPreference('summary', true);
  const alarm = 'yong-planner:alarm:2099-01-01:daily%3Aorphan';
  const unrelated = 'another-app:alarm';
  for (const id of [alarm, unrelated]) {
    const request = { identifier: id, content: { data: {} } };
    pending.set(id, request);
    presented.set(id, request);
  }
  const data = emptyData();
  data.dailyPlanItems = [
    { id: 'old', date: '2000-01-01', content: '지난 일정', time: '09:00', alarm: true },
  ];
  usePlanner.setState({ data });
  await clearScheduleAlarms();
  assert.equal(pending.has(alarm), false);
  assert.equal(presented.has(alarm), false);
  assert.equal(pending.has(unrelated), true);
  assert.equal(presented.has(unrelated), true);
  assert.ok([...pending.keys()].some((id) => id.startsWith('yong-planner:summary:')));
  assert.ok([...presented.keys()].some((id) => id.startsWith('yong-planner:summary:')));
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].alarm, undefined);
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].time, '09:00');
  await syncNotifications();
  assert.equal(pending.has(alarm), false);
});

test('past one-shot alarms are not rescheduled on the following day', async () => {
  granted = true;
  const data = emptyData();
  data.dailyPlanItems = [
    { id: 'past', date: '2000-01-01', content: '지난 알람', time: '09:00', alarm: true },
  ];
  usePlanner.setState({ data });
  await syncNotifications();
  await syncNotifications();
  assert.equal(pending.size, 0);
});

test('alarm deletion is blocked during restoration', async () => {
  usePlanner.setState({ restoring: true });
  await assert.rejects(clearScheduleAlarms(), /불러온 후/);
  assert.equal(events.includes('flush-planner'), false);
});

test('changing a schedule time cancels its old alarm instead of moving it to the new time', async () => {
  const { dateKey } = require('../src/utils/date.ts');
  const { timeChangeClearsAlarm } = require('../src/features/planner/services/alarms.ts');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const data = emptyData();
  data.dailyPlanItems = ['a', 'b'].map((id) => ({
    id,
    date: dateKey(tomorrow),
    content: id,
    time: '13:00',
    alarm: true,
  }));
  usePlanner.setState({ data });
  granted = true;
  await syncNotifications();
  const idFor = (id) =>
    [...pending.keys()].find((key) => key.endsWith(encodeURIComponent('daily:' + id)));
  const removed = idFor('a');
  const kept = idFor('b');
  usePlanner.setState({
    data: {
      ...data,
      dailyPlanItems: data.dailyPlanItems.map((item) =>
        item.id === 'a'
          ? {
              ...item,
              time: '14:00',
              alarm: timeChangeClearsAlarm(item, '14:00') ? undefined : item.alarm,
            }
          : item,
      ),
    },
  });
  await syncNotifications();
  assert.equal(pending.has(removed), false);
  assert.equal(pending.has(kept), true);
  assert.equal(pending.size, 1);
});

test('canceling the permission modal does not request or save an alarm', async () => {
  acceptPermission = false;
  await assert.rejects(authorizeScheduleAlarm(), /저장하지/);
  assert.equal(storedPreferences, null);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
  assert.equal(
    events.some((event) => event.type === 'permission'),
    false,
  );
});
test('lock screen alone creates notifications without changing the status bar preference', async () => {
  await changeNotificationPreference('lockScreen', true);
  assert.equal(useNotificationStore.getState().preferences.summary, false);
  assert.equal(useNotificationStore.getState().preferences.lockScreen, true);
  assert.equal(pending.size, 7);
  assert.equal(presented.size, 1);
  assert.ok([...pending.values()].every((request) => request.trigger.channelId.includes('public')));
  granted = false;
  await syncNotifications();
  assert.equal(pending.size, 0);
  assert.equal(presented.size, 0);
});

test('denied exact alarm permission prevents saving alarm preferences and permits retry', async () => {
  granted = true;
  allowExact = false;
  const preferences = useNotificationStore.getState().preferences;
  await assert.rejects(authorizeScheduleAlarm(), /정확한 알람 권한/);
  assert.equal(useNotificationStore.getState().preferences, preferences);
  assert.equal(storedPreferences, null);
  assert.equal(useNotificationStore.getState().busy, false);
  allowExact = true;
  await authorizeScheduleAlarm();
  assert.equal(useNotificationStore.getState().preferences.alarms, true);
  assert.equal(useNotificationStore.getState().preferences.exact, true);
});
