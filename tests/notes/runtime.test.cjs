require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const React = require('react');
const { createModuleMock } = require('../support/mock-module.cjs');
const { pruneMemoTrash, MEMO_RETENTION_MS } = require('../../src/features/notes/services/trash.ts');
const mock = createModuleMock(require);
let params, store, reference, cleanup, appStateChange, removed, purges;
mock('react', {
  ...React,
  useRef: () => reference,
  useEffect: (effect) => {
    cleanup = effect();
  },
});
mock('expo-router', { useLocalSearchParams: () => params });
mock('react-native', {
  AppState: {
    addEventListener: (_, callback) => {
      appStateChange = callback;
      return {
        remove() {
          removed = true;
        },
      };
    },
  },
});
const usePlanner = (select) => select(store);
usePlanner.getState = () => store;
mock('../../src/stores/planner.ts', { usePlanner });
mock('../../src/features/notes/hooks/useMemoActions.ts', {
  useMemoActions: () => ({
    purgeMemoTrash: async () => {
      purges++;
      store.data = pruneMemoTrash(store.data);
    },
  }),
});
const { useMemoRoute } = require('../../src/features/notes/hooks/useMemoRoute.ts');
const { useMemoRetention } = require('../../src/features/notes/hooks/useMemoRetention.ts');
beforeEach(() => {
  params = {};
  reference = { current: undefined };
  cleanup = appStateChange = undefined;
  removed = false;
  purges = 0;
  store = { ready: true, restoring: false, data: { memos: [] } };
});

test('search opens the matching list and memo once per request, including after a temporary restore lock', () => {
  const now = new Date().toISOString();
  store.data.memos = [
    { id: 'live', content: '활성', updatedAt: now },
    { id: 'trash', content: '휴지통', updatedAt: now, deletedAt: now },
  ];
  const calls = [];
  const state = {
    disabled: true,
    open: (memo) => calls.push(memo.id),
    openTrash: () => calls.push('trash-list'),
    closeTrash: () => calls.push('live-list'),
  };
  params = { memoId: 'live', memoKey: '1' };
  useMemoRoute(state);
  assert.deepEqual(calls, []);
  state.disabled = false;
  useMemoRoute(state);
  useMemoRoute(state);
  params = { memoId: 'trash', memoKey: '2' };
  useMemoRoute(state);
  assert.deepEqual(calls, ['live-list', 'live', 'trash-list', 'trash']);
  params = { memoId: 'missing', memoKey: '3' };
  useMemoRoute(state);
  assert.equal(calls.length, 4);
});

test('retention survives the native timer maximum and purges at 30 days; foreground resumes cleanup', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.parse('2026-11-01T00:00:00Z') });
  const now = new Date().toISOString();
  store.data.memos = [{ id: 'trash', content: '보관', updatedAt: now, deletedAt: now }];
  useMemoRetention();
  t.mock.timers.tick(2147483647);
  assert.equal(store.data.memos.length, 1);
  t.mock.timers.tick(MEMO_RETENTION_MS - 2147483647);
  assert.equal(store.data.memos.length, 0);
  const before = purges;
  appStateChange('background');
  assert.equal(purges, before);
  appStateChange('active');
  assert.equal(purges, before + 1);
  cleanup();
  assert.equal(removed, true);
  t.mock.timers.tick(10000);
  assert.equal(purges, before + 1);
});
