const { assert, beforeEach, test } = require('../support/test.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const mock = createModuleMock(require);
let options, result, selectionError, readError, content, size;
mock('expo-clipboard', { setStringAsync: async () => {} });
mock('expo-sharing', {});
mock('expo-document-picker', {
  getDocumentAsync: async (value) => {
    options = value;
    if (selectionError) throw selectionError;
    return result;
  },
});
mock('expo-file-system', {
  File: class {
    get size() {
      return size;
    }
    async text() {
      if (readError) throw readError;
      return content;
    }
    async bytes() {
      if (readError) throw readError;
      return content;
    }
  },
  Paths: {},
});
const { chooseBackup } = require('../../src/data/export/files.ts');
const { createBackup, MAX_BACKUP_BYTES } = require('../../src/services/backup/index.ts');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { zipJson } = require('../../src/services/backup/zip.ts');
const { BackupRestoreError, restoreErrorMessage } = require('../../src/services/backup/errors.ts');
beforeEach(() => {
  result = { canceled: false, assets: [{ uri: 'content://backup', name: 'backup.json' }] };
  content = createBackup(emptyData());
  selectionError = readError = null;
  size = 100;
});

test('picker shows all provider files and restores JSON regardless of MIME metadata', async () => {
  assert.deepEqual(await chooseBackup(), emptyData());
  assert.deepEqual(options, { type: '*/*', multiple: false, copyToCacheDirectory: true });
  result.canceled = true;
  assert.equal(await chooseBackup(), null);
});

test('ZIP restore validates content and supports uppercase extension', async () => {
  result.assets[0].name = 'backup.ZIP';
  content = zipJson(content);
  assert.deepEqual(await chooseBackup(), { ...emptyData(), kind: 'full' });
  content = new Uint8Array([0, 1, 2]);
  await assert.rejects(
    chooseBackup,
    (error) => error.message === new BackupRestoreError('format').message,
  );
});

test('selection, read, JSON parse and size errors expose only curated messages', async () => {
  const raw = new Error('EACCES: /private/token SQL native error');
  selectionError = raw;
  await assert.rejects(
    chooseBackup,
    (error) => error.message === new BackupRestoreError('selection').message,
  );
  selectionError = null;
  readError = raw;
  await assert.rejects(
    chooseBackup,
    (error) => error.message === new BackupRestoreError('read').message,
  );
  readError = null;
  content = 'private invalid JSON';
  await assert.rejects(
    chooseBackup,
    (error) => error.message === new BackupRestoreError('format').message,
  );
  size = MAX_BACKUP_BYTES + 1;
  await assert.rejects(
    chooseBackup,
    (error) => error.message === new BackupRestoreError('size').message,
  );
  assert.doesNotMatch(restoreErrorMessage(raw), /EACCES|private|SQL|native/);
  assert.doesNotMatch(restoreErrorMessage('raw failure'), /raw failure/);
});
