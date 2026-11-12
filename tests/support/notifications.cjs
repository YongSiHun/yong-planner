const { createModuleMock } = require('./mock-module.cjs');
require('./register.cjs');
const state = {};

const { beforeEach } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { defaultNotificationPreferences } = require('../../src/features/notifications/types.ts');
const { today } = require('../../src/utils/date.ts');
const events = [];

const pending = new Map();

const presented = new Map();

const platform = { OS: 'android' };

const mock = createModuleMock(require);

function permissions() {
  return {
    granted: state.granted,
    status: state.granted ? 'granted' : 'denied',
    canAskAgain: true,
    ios: platform.OS === 'ios' ? { allowsSound: state.sound } : undefined,
  };
}

mock('react-native', {
  Platform: platform,
  Alert: {
    alert: (_title, _message, buttons) => buttons[state.acceptPermission ? 1 : 0].onPress(),
  },
  Linking: { openSettings: async () => events.push('settings') },
});

mock('expo-sqlite/kv-store', {
  getItem: async (key) =>
    key === 'notification-startup-requested-v1' ? state.startupRequested : state.storedPreferences,
  setItem: async (key, value) => {
    if (key === 'notification-startup-requested-v1') {
      state.startupRequested = value;
      return;
    }
    state.storedPreferences = value;
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
  getExactAlarmPermissionsAsync: async () => ({ granted: state.exact, canAskAgain: true }),
  requestPermissionsAsync: async (request) => {
    events.push({ type: 'permission', request });
    state.granted = state.allowPrompt;
    state.sound = request.ios.allowSound;
    return permissions();
  },
  requestExactAlarmPermissionsAsync: async () => {
    events.push({ type: 'exact' });
    state.exact = state.allowExact;
    return { granted: state.exact };
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

const { usePlanner } = require('../../src/stores/planner.ts');
const { useNotificationStore } = require('../../src/stores/notifications.ts');

mock('../../src/features/planner/controllers/persistence.ts', {
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
} = require('../../src/features/notifications/controllers/notifications.ts');

beforeEach(() => {
  state.granted = false;
  state.exact = false;
  state.sound = false;
  state.allowPrompt = true;
  state.allowExact = true;
  state.storedPreferences = null;
  state.startupRequested = null;
  state.acceptPermission = true;
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

function freshStartupRequest() {
  const filename = require.resolve('../../src/features/notifications/controllers/notifications.ts');
  delete require.cache[filename];
  delete require.cache[
    require.resolve('../../src/features/notifications/controllers/notificationStartup.ts')
  ];
  return require(filename).requestStartupNotificationPermission;
}

module.exports = {
  authorizeScheduleAlarm,
  changeNotificationPreference,
  clearScheduleAlarms,
  defaultNotificationPreferences,
  emptyData,
  events,
  freshStartupRequest,
  initializeNotifications,
  pending,
  platform,
  presented,
  requestStartupNotificationPermission,
  startNotificationSync,
  state,
  syncNotifications,
  today,
  useNotificationStore,
  usePlanner,
};
