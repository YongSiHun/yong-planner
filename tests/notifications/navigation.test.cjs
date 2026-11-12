const { createModuleMock } = require('../support/mock-module.cjs');
require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const mock = createModuleMock(require);
let ready;
let routes;
let cleanups;
let starts;
let appStateHandler;
let flushed;
let stops;
let clears;
let removed;
let callback;
let lastResponse;
let runtime;
let startup;
let parameters;
let refs;
let cursor;
mock('react', {
  useEffect: (effect) => {
    cleanups.push(effect());
  },
  useRef: (initial) => {
    const index = cursor++;
    refs[index] ??= { current: initial };
    return refs[index];
  },
});
mock('react-native', {
  AppState: {
    addEventListener: (_event, listener) => {
      appStateHandler = listener;
      return { remove() {} };
    },
  },
});
mock('expo-router', {
  router: { push: (route) => routes.push(route) },
  useRootNavigationState: () => (ready ? { key: 'root' } : undefined),
  useNavigationContainerRef: () => ({ isReady: () => ready }),
  useLocalSearchParams: () => parameters,
});
mock('../../src/features/notifications/controllers/notifications.ts', {
  startNotificationSync: () => {
    starts++;
    return () => stops++;
  },
  refreshNotificationPermissions: async () => {},
  requestStartupNotificationPermission: () => startup,
  flushEnabledNotifications: async () => {
    flushed++;
  },
});
const native = {
  addNotificationResponseReceivedListener: (listener) => {
    callback = listener;
    return { remove: () => removed++ };
  },
  getLastNotificationResponse: () => lastResponse,
  clearLastNotificationResponse: () => clears++,
};
mock('../../src/features/notifications/data/native.ts', { notificationRuntime: () => runtime });
const {
  useNotificationLifecycle,
} = require('../../src/features/notifications/hooks/useNotificationLifecycle.ts');
const { useNotificationDate } = require('../../src/features/planner/hooks/useNotificationDate.ts');
function response(id, date) {
  return { notification: { request: { identifier: id, content: { data: { date } } } } };
}
function renderLifecycle() {
  // React 훅: 생명주기 mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useNotificationLifecycle();
}
function renderDate(onNavigate) {
  cursor = 0;
  // React 훅: query mock 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useNotificationDate(onNavigate);
}
beforeEach(() => {
  ready = false;
  routes = [];
  cleanups = [];
  starts = 0;
  flushed = 0;
  stops = 0;
  clears = 0;
  removed = 0;
  callback = undefined;
  lastResponse = null;
  runtime = Promise.resolve(native);
  startup = Promise.resolve();
  parameters = {};
  refs = [];
  cursor = 0;
});
test('cold-start notification waits for navigation readiness and ignores unrelated responses', async () => {
  lastResponse = response('yong-planner:alarm:a', '2026-11-08');
  renderLifecycle();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(starts, 0);
  assert.equal(routes.length, 0);
  ready = true;
  renderLifecycle();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(starts, 1);
  assert.equal(routes[0].params.notificationDate, '2026-11-08');
  assert.equal(clears, 1);
  callback(response('other', '2026-11-09'));
  assert.equal(routes.length, 1);
  assert.equal(clears, 1);
  callback(response('yong-planner:alarm:b', '2026-11-09'));
  assert.equal(routes.length, 2);
  assert.equal(clears, 2);
  appStateHandler('background');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(flushed, 2);
  cleanups.at(-1)();
  assert.equal(stops, 1);
  assert.equal(removed, 1);
});
test('unmount before native import finishes does not install listeners or navigate', async () => {
  ready = true;
  let release;
  runtime = new Promise((resolve) => {
    release = resolve;
  });
  renderLifecycle();
  cleanups.at(-1)();
  release(native);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(callback, undefined);
  assert.equal(routes.length, 0);
  assert.equal(stops, 1);
});
test('notification date is applied once per event and malformed dates are ignored', () => {
  parameters = { notificationDate: '2026-11-08', notificationKey: '1' };
  const dates = [];
  renderDate((date) => dates.push(date));
  renderDate((date) => dates.push(date));
  assert.deepEqual(dates, ['2026-11-08']);
  parameters = { notificationDate: '2026-13-40', notificationKey: '2' };
  renderDate((date) => dates.push(date));
  assert.deepEqual(dates, ['2026-11-08']);
  parameters = { notificationDate: '2026-11-09', notificationKey: '3' };
  renderDate((date) => dates.push(date));
  assert.deepEqual(dates, ['2026-11-08', '2026-11-09']);
});

test('startup approval immediately applies enabled notifications', async () => {
  ready = true;
  let approve;
  startup = new Promise((resolve) => {
    approve = resolve;
  });
  renderLifecycle();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(flushed, 0);
  approve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(flushed, 1);
  cleanups.at(-1)();
});

test('startup approval after unmount does not restart notification work', async () => {
  ready = true;
  let approve;
  startup = new Promise((resolve) => {
    approve = resolve;
  });
  renderLifecycle();
  cleanups.at(-1)();
  approve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(flushed, 0);
});
