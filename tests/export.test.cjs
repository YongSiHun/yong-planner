require('./register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const shared = [];
let copied;
let shareError;
function mock(name, exports) {
  const filename = require.resolve(name);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}
mock('react-native', {
  Share: {
    share: async (payload) => {
      if (shareError) throw shareError;
      shared.push(payload);
      return { action: 'sharedAction' };
    },
  },
});
mock('expo-file-system', {
  File: class {
    constructor() {
      throw new Error('Text sharing must not create files');
    }
  },
  Paths: { cache: 'cache' },
});
mock('expo-sharing', {});
mock('expo-clipboard', {
  setStringAsync: async (text) => {
    copied = text;
  },
});
mock('expo-document-picker', {});
const { exportMonth } = require('../src/services/export/files.ts');
const { emptyData } = require('../src/features/planner/types/index.ts');
function fixture() {
  return {
    ...emptyData(),
    dailyPlanItems: [
      {
        id: 'daily',
        date: '2026-11-07',
        content: '회의\n장보기',
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  };
}
beforeEach(() => {
  copied = undefined;
  shareError = undefined;
  shared.length = 0;
});

test('Kakao share opens the OS text share sheet with the selected month schedule', async () => {
  await exportMonth(fixture(), '2026-11-07', 'share');
  assert.equal(shared.length, 1);
  assert.equal(shared[0].title, '2026년 11월 일정');
  assert.ok(shared[0].message.startsWith('2026년 11월'));
  assert.ok(shared[0].message.includes('회의'));
  assert.ok(shared[0].message.includes('장보기'));
  assert.equal(shared[0].url, undefined);
  assert.equal(copied, undefined);
});

test('content copy writes the same Korean plain text without opening the share sheet', async () => {
  await exportMonth(fixture(), '2026-11-07', 'clipboard');
  assert.ok(copied.includes('회의'));
  assert.ok(copied.includes('장보기'));
  assert.equal(shared.length, 0);
  await exportMonth(fixture(), '2026-11-07', 'share');
  assert.equal(copied, shared[0].message);
});

test('share failures reach the screen so an error can be displayed', async () => {
  shareError = new Error('share failed');
  await assert.rejects(exportMonth(fixture(), '2026-11-07', 'share'), /share failed/);
});
