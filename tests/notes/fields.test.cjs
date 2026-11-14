require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { memoFields } = require('../../src/features/notes/services/memo.ts');
const { validateData } = require('../../src/services/backup/validation.ts');
const { createNotesBackup } = require('../../src/services/backup/notes.ts');

test('legacy memos display first-line titles without losing their body', () => {
  assert.deepEqual(memoFields({ content: '기존 제목\r\n\r\n기존 본문' }), {
    title: '기존 제목',
    body: '\n기존 본문',
  });
  assert.deepEqual(memoFields({ title: '', content: '본문 첫 줄\n둘째 줄' }), {
    title: '',
    body: '본문 첫 줄\n둘째 줄',
  });
});

test('backup validation preserves separate titles and accepts title-only memos', () => {
  const data = emptyData();
  data.memos = [
    { id: 'title-only', title: '제목만', content: '', updatedAt: '2026-11-14T00:00:00Z' },
    { id: 'separate', title: '제목', content: '본문', updatedAt: '2026-11-14T00:00:00Z' },
  ];
  assert.deepEqual(validateData(data).memos, data.memos);
  assert.throws(() => validateData({ ...data, memos: [{ ...data.memos[0], title: '' }] }), /메모/);
  assert.throws(() => validateData({ ...data, memos: [{ ...data.memos[0], title: 3 }] }), /문자열/);
  assert.deepEqual(validateData(JSON.parse(createNotesBackup(data))).memos, data.memos);
});

test('backups apply the same title and total length limits while accepting the boundary', () => {
  const data = emptyData();
  const memo = {
    id: 'limits',
    title: '가'.repeat(1000),
    content: '나'.repeat(99000),
    updatedAt: '2026-11-14T00:00:00Z',
  };
  data.memos = [memo];
  assert.equal(validateData(data).memos[0].content.length, 99000);
  assert.throws(
    () => validateData({ ...data, memos: [{ ...memo, title: '가'.repeat(1001) }] }),
    /1,000자/,
  );
  assert.throws(
    () => validateData({ ...data, memos: [{ ...memo, content: '나'.repeat(99001) }] }),
    /100,000자/,
  );
});
