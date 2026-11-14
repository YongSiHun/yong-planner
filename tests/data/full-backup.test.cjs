require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const zlib = require('node:zlib');
const { Buffer } = require('node:buffer');
const { randomBytes } = require('node:crypto');
const { deflate, inflate } = require('../../src/services/backup/deflate.ts');
const { zipJson, unzipJson } = require('../../src/services/backup/zip.ts');
const { createBackup, parseBackup } = require('../../src/services/backup/index.ts');
const { createNotesBackup, mergeNotesBackup } = require('../../src/services/backup/notes.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');

test('DEFLATE interoperates with Node for fixed, dynamic, stored and multiple blocks', () => {
  const texts = [
    Buffer.alloc(0),
    Buffer.from('장기 계획 🐉 '.repeat(2000)),
    randomBytes(100000),
    Buffer.from(
      JSON.stringify(
        Array.from({ length: 3000 }, (_, i) => ({ date: '2026-11-14', content: '일정 ' + i })),
      ),
    ),
  ];
  for (const input of texts) {
    assert.deepEqual(Buffer.from(zlib.inflateRawSync(deflate(input))), input);
    for (const options of [{ level: 0 }, { level: 9 }, { strategy: zlib.constants.Z_FIXED }]) {
      assert.deepEqual(
        Buffer.from(inflate(zlib.deflateRawSync(input, options), input.length)),
        input,
      );
    }
  }
  const input = Buffer.from('abc'.repeat(5000));
  assert.ok(deflate(input).length < input.length / 4);
});

test('ZIP contains a real compressed JSON entry with valid central directory and bounded restore', () => {
  const json = JSON.stringify({ content: '메모 🐉'.repeat(300) });
  const zip = zipJson(json);
  assert.equal(unzipJson(zip), json);
  assert.ok(zip.length < Buffer.byteLength(json));
  const header = Buffer.from(zip);
  const filenameLength = header.readUInt16LE(26);
  const compressed = header.subarray(
    30 + filenameLength,
    30 + filenameLength + header.readUInt32LE(18),
  );
  assert.equal(zlib.inflateRawSync(compressed).toString('utf8'), json);
  const corrupt = Uint8Array.from(zip);
  corrupt[30 + filenameLength] ^= 0x10;
  assert.throws(() => unzipJson(corrupt));
  assert.throws(() => unzipJson(zip.subarray(0, zip.length - 3)));
  const bomb = Buffer.from(zip);
  const central = bomb.readUInt32LE(bomb.length - 6);
  bomb.writeUInt32LE(100 * 1024 * 1024, central + 24);
  assert.throws(() => unzipJson(bomb), /50MB/);
});

test('full backup preserves sparse months, notes, orders and settings through ZIP', () => {
  const data = {
    ...emptyData(),
    memos: [{ id: 'memo', content: '언젠가 할 일', updatedAt: '2026-11-14T03:00:00Z' }],
    settings: { theme: 'dark' },
    dailyPlanItems: [
      { id: 'a', date: '2024-01-01', content: '과거', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'b', date: '2028-12-31', content: '미래', createdAt: '2026-11-14T00:00:00Z' },
    ],
    dailyPlanOrders: [{ date: '2024-01-01', itemIds: ['daily:a'] }],
  };
  assert.deepEqual(parseBackup(unzipJson(zipJson(createBackup(data)))), data);
  const old = JSON.parse(createBackup(data));
  old.version = 4;
  delete old.memos;
  assert.deepEqual(parseBackup(JSON.stringify(old)).memos, []);
});

test('notes restore merges IDs without changing schedules or settings; month exports omit notes', () => {
  const current = {
    ...emptyData(),
    memos: [
      { id: 'same', content: 'old', updatedAt: '2026-11-13T00:00:00Z' },
      { id: 'keep', content: 'keep', updatedAt: '2026-11-13T00:00:00Z' },
    ],
  };
  const incoming = {
    ...emptyData(),
    memos: [{ id: 'same', content: 'new', updatedAt: '2026-11-14T00:00:00Z' }],
  };
  const parsed = parseBackup(createNotesBackup(incoming));
  assert.equal(parsed.kind, 'notes');
  const merged = mergeNotesBackup(current, parsed);
  assert.equal(merged.memos.length, 2);
  assert.equal(merged.memos.find((m) => m.id === 'same').content, 'new');
  assert.deepEqual(merged.dailyPlanItems, current.dailyPlanItems);
  assert.deepEqual(merged.settings, current.settings);
  assert.deepEqual(parseBackup(createBackup(current, '2026-11')).memos, []);
});
