const { createModuleMock } = require('../support/mock-module.cjs');
require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const files = [];
const fileShares = [];
let copied;
const mock = createModuleMock(require);
mock('expo-file-system', {
  File: class {
    constructor(directory, name) {
      this.name = name;
      this.uri = directory + '/' + name;
      files.push(this);
    }
    create() {}
    write(content) {
      this.content = content;
    }
  },
  Paths: { cache: 'cache' },
});
mock('expo-sharing', {
  isAvailableAsync: async () => true,
  shareAsync: async (uri, options) => fileShares.push({ uri, ...options }),
});
mock('expo-clipboard', {
  setStringAsync: async (text) => {
    copied = text;
  },
});
mock('expo-document-picker', {});
const { exportMonth } = require('../../src/services/export/files.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');
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
  files.length = 0;
  fileShares.length = 0;
});

test('content copy writes the same Korean plain text without opening the share sheet', async () => {
  await exportMonth(fixture(), '2026-11-07', 'clipboard');
  assert.ok(copied.includes('회의'));
  assert.ok(copied.includes('장보기'));
  assert.equal(files.length, 0);
});

for (const [format, mimeType] of [
  ['json', 'application/json'],
  ['txt', 'text/plain'],
  ['csv', 'text/csv'],
]) {
  test(format + ' uses the selected year and month in its filename', async () => {
    await exportMonth(fixture(), '2026-11-07', format);
    assert.equal(files[0].name, 'yongplanner-2026-11.' + format);
    assert.equal(fileShares[0].mimeType, mimeType);
    if (format === 'json') {
      const { parseBackup } = require('../../src/services/backup/index.ts');
      const backup = parseBackup(files[0].content);
      assert.equal(backup.month, '2026-11');
      assert.equal(backup.dailyPlanItems[0].content, '회의\n장보기');
    }
  });
}
