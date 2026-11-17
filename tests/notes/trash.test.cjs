require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const {
  memoExpired,
  pruneMemoTrash,
  MEMO_RETENTION_MS,
} = require('../../src/features/notes/services/trash.ts');
const { validateData, createBackup, parseBackup } = require('../../src/services/backup/index.ts');
const { createNotesBackup } = require('../../src/services/backup/notes.ts');

test('trash expires at exactly 30 elapsed days and unchanged pruning preserves the data reference', () => {
  const start = Date.parse('2026-11-01T13:20:30Z');
  const memo = {
    id: 'a',
    content: '보관',
    updatedAt: new Date(start).toISOString(),
    deletedAt: new Date(start).toISOString(),
  };
  const data = { ...emptyData(), memos: [memo] };
  assert.equal(memoExpired(memo, start + MEMO_RETENTION_MS - 1), false);
  assert.equal(pruneMemoTrash(data, start + MEMO_RETENTION_MS - 1), data);
  assert.equal(memoExpired(memo, start + MEMO_RETENTION_MS), true);
  assert.deepEqual(pruneMemoTrash(data, start + MEMO_RETENTION_MS).memos, []);
  assert.equal(memoExpired({ ...memo, deletedAt: undefined }, start + MEMO_RETENTION_MS), false);
});

test('notes and full backup retain restorable trash and discard expired trash; old notes remain compatible', () => {
  const now = new Date().toISOString();
  const live = { id: 'live', title: '제목', content: '본문', updatedAt: now };
  const trash = { ...live, id: 'trash', deletedAt: now };
  const expired = { ...live, id: 'expired', deletedAt: '2020-01-01T00:00:00Z' };
  const data = { ...emptyData(), memos: [live, trash, expired] };
  assert.deepEqual(
    validateData(data).memos,
    data.memos,
    'database diff must see expired rows before removal',
  );
  for (const json of [createNotesBackup(data), createBackup(data)]) {
    assert.deepEqual(parseBackup(json).memos, [live, trash]);
  }
  assert.throws(() => validateData({ ...data, memos: [{ ...trash, deletedAt: 'bad' }] }));
  assert.deepEqual(
    validateData({ ...data, memos: [{ id: 'legacy', content: '옛 제목\n본문', updatedAt: now }] })
      .memos[0].content,
    '옛 제목\n본문',
  );
});
