const { assert, test } = require('../support/test.cjs');
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
const {
  deleteMemos,
  restoreMemos,
  purgeMemoTrash,
  saveMemo,
} = require('../../src/features/notes/controllers/notes.ts');
test('bulk deletion moves only chosen IDs to trash in one persisted update', async () => {
  const kept = { id: 'keep', content: '동일한 내용', updatedAt: '2026-11-14T00:00:00Z' };
  data = { memos: [{ ...kept, id: 'a' }, kept, { ...kept, id: 'b' }], settings: { theme: 'dark' } };
  const settings = data.settings;
  await deleteMemos(new Set(['a', 'b', 'missing']));
  assert.deepEqual(
    data.memos.filter((memo) => !memo.deletedAt),
    [kept],
  );
  assert.equal(data.memos.filter((memo) => memo.deletedAt).length, 2);
  assert.equal(data.memos[0].updatedAt, kept.updatedAt);
  assert.equal(data.settings, settings);
  assert.equal(publications, 1);
  assert.equal(flushes, 1);
  await saveMemo(null, '새 제목\n\n본문');
  assert.equal(data.memos.at(-1).content, '새 제목\n\n본문');
  await saveMemo('new-memo', '바꾼 제목\n본문 수정');
  assert.equal(data.memos.length, 4);
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

test('restore preserves identity and fields; expired trash is permanently removed and cannot be restored', async () => {
  const now = Date.now();
  const saved = {
    id: 'restore',
    title: '제목',
    content: '본문',
    updatedAt: new Date(now - 1000).toISOString(),
  };
  const deletedAt = new Date(now - 1000).toISOString();
  data = {
    memos: [
      { ...saved, deletedAt },
      { ...saved, id: 'expired', deletedAt: new Date(now - 30 * 86400000 - 1).toISOString() },
    ],
  };
  await assert.rejects(saveMemo('restore', '변경', '제목'), /복구/);
  await deleteMemos(new Set(['restore']));
  assert.equal(data.memos[0].deletedAt, deletedAt, 'repeated deletion must not restart retention');
  await restoreMemos(new Set(['restore', 'expired']));
  assert.deepEqual(data.memos, [saved]);
  data.memos.push({ ...saved, id: 'expired-again', deletedAt: '2020-01-01T00:00:00Z' });
  await purgeMemoTrash();
  assert.deepEqual(data.memos, [saved]);
});
