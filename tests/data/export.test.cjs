const { createModuleMock } = require('../support/mock-module.cjs');
require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { Buffer } = require('node:buffer');
const content = new Map();
let picked;
let requested;
const files = [];
const fileShares = [];
let copied;
const mock = createModuleMock(require);
mock('expo-file-system', {
  File: class {
    constructor(directory, name) {
      this.name = name;
      this.uri = name ? directory + '/' + name : directory;
      files.push(this);
    }
    get size() {
      return content.get(this.uri)?.length ?? 0;
    }
    async text() {
      return content.get(this.uri).toString('utf8');
    }
    async bytes() {
      return content.get(this.uri);
    }
    create() {}
    store(value) {
      content.set(this.uri, Buffer.from(value));
    }
    write(content) {
      this.content = content;
      this.store(content);
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
mock('expo-document-picker', {
  getDocumentAsync: async (options) => {
    requested = options;
    return picked;
  },
});
const {
  exportMonth,
  chooseBackup,
  exportFullBackup,
} = require('../../src/services/export/files.ts');
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
  content.clear();
  picked = undefined;
  requested = undefined;
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

const { createBackup } = require('../../src/services/backup/index.ts');
const { createNotesBackup } = require('../../src/services/backup/notes.ts');
const { zipJson } = require('../../src/services/backup/zip.ts');
const memo = { id: 'memo', content: '장기 계획', updatedAt: '2026-11-14T00:00:00Z' };

function pick(name, bytes) {
  content.set('picked', Buffer.from(bytes));
  picked = { canceled: false, assets: [{ uri: 'picked', name }] };
}

test('full export shares a ZIP that the picker restores as all data', async () => {
  const data = { ...emptyData(), memos: [memo] };
  await exportFullBackup(data);
  assert.equal(fileShares[0].mimeType, 'application/zip');
  assert.equal(fileShares[0].UTI, 'public.zip-archive');
  pick('BACKUP.ZIP', content.get(fileShares[0].uri));
  const restored = await chooseBackup();
  assert.equal(restored.kind, 'full');
  assert.deepEqual(restored.memos, [memo]);
  assert.ok(requested.type.includes('application/zip'));
});

test('JSON picker identifies a month or notes and rejects a partial backup disguised as full ZIP', async () => {
  const data = { ...emptyData(), memos: [memo] };
  pick('month.json', createBackup(data, '2026-11'));
  assert.equal((await chooseBackup()).month, '2026-11');
  pick('memos.json', createNotesBackup(data));
  assert.equal((await chooseBackup()).kind, 'notes');
  pick('partial.zip', zipJson(createNotesBackup(data)));
  await assert.rejects(chooseBackup(), /전체 백업 ZIP/);
  picked = { canceled: true };
  assert.equal(await chooseBackup(), null);
});

let restoredData;
mock('../../src/features/planner/controllers/planner.ts', {
  restorePlanner: async (data) => {
    restoredData = data;
  },
});
mock('../../src/features/planner/controllers/persistence.ts', { flushPlanner: async () => {} });
const { usePlanner } = require('../../src/stores/planner.ts');
const { restorePlannerBackup } = require('../../src/features/settings/controllers/backup.ts');

test('restore controller routes notes, months and whole backups without crossing data scopes', async () => {
  const current = { ...emptyData(), memos: [memo], settings: { theme: 'dark' } };
  usePlanner.setState({ ready: true, data: current });
  await restorePlannerBackup({
    ...emptyData(),
    kind: 'notes',
    memos: [{ ...memo, content: '수정' }],
  });
  assert.equal(restoredData.memos[0].content, '수정');
  assert.deepEqual(restoredData.settings, current.settings);
  await restorePlannerBackup({ ...emptyData(), month: '2026-11' });
  assert.deepEqual(restoredData.memos, current.memos);
  assert.deepEqual(restoredData.settings, current.settings);
  await restorePlannerBackup({ ...emptyData(), kind: 'full' });
  assert.deepEqual(restoredData.memos, []);
  assert.deepEqual(restoredData.settings, { theme: 'system' });
});
