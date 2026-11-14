require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createModuleMock } = require('../support/mock-module.cjs');
const mock = createModuleMock(require);
let data,
  publications = 0,
  flushes = 0;
mock('expo-crypto', { randomUUID: () => 'new-memo' });
mock('../../src/features/planner/controllers/persistence.ts', {
  updatePlanner: (change) => {
    data = change(data);
    publications++;
  },
  flushPlanner: async () => {
    flushes++;
  },
});
mock('../../src/stores/planner.ts', { usePlanner: {} });
mock('../../src/services/export/files.ts', { shareFile: async () => {} });
const { deleteMemos, saveMemo } = require('../../src/features/notes/controllers/notes.ts');
test('bulk deletion removes only chosen IDs in one persisted update', async () => {
  const kept = { id: 'keep', content: '동일한 내용', updatedAt: '2026-11-14T00:00:00Z' };
  data = { memos: [{ ...kept, id: 'a' }, kept, { ...kept, id: 'b' }], settings: { theme: 'dark' } };
  const settings = data.settings;
  await deleteMemos(new Set(['a', 'b', 'missing']));
  assert.deepEqual(data.memos, [kept]);
  assert.equal(data.settings, settings);
  assert.equal(publications, 1);
  assert.equal(flushes, 1);
  await saveMemo(null, '새 제목\n\n본문');
  assert.equal(data.memos.at(-1).content, '새 제목\n\n본문');
  await saveMemo('new-memo', '바꾼 제목\n본문 수정');
  assert.equal(data.memos.length, 2);
  assert.equal(data.memos.at(-1).id, 'new-memo');
});

test('memo length limits reject oversized saves before state or persistence changes', async () => {
  const previous = data;
  const priorPublications = publications;
  const priorFlushes = flushes;
  await assert.rejects(saveMemo(null, '본문', '가'.repeat(1001)), /1,000자/);
  await assert.rejects(saveMemo(null, '가'.repeat(100000), '제목'), /100,000자/);
  await assert.rejects(saveMemo(null, ' '.repeat(100001)), /100,000자/);
  await assert.rejects(saveMemo(null, '  ', '  '), /입력/);
  assert.equal(data, previous);
  assert.equal(publications, priorPublications);
  assert.equal(flushes, priorFlushes);
  await saveMemo(null, '나'.repeat(99000), '가'.repeat(1000));
  const memo = data.memos.at(-1);
  assert.equal(memo.title.length + memo.content.length, 100000);
});
