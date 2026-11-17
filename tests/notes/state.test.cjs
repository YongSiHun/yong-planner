const { assert, beforeEach, test } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const { deleteConfirmation } = require('../../src/services/confirmation.ts');
const hooks = createHookHarness();
const mock = createModuleMock(require);
let dialog, reported, deleted, restored, fail, store;
mock('react', hooks.react);
mock('../../src/components/ui/index.tsx', {
  showDeleteDialog: (message, onConfirm) => {
    dialog = deleteConfirmation(message, onConfirm);
  },
  report: (error) => {
    reported = error;
  },
  showDialog: (title, message, actions) => {
    dialog = { title, message, actions };
  },
});
mock('../../src/stores/planner.ts', { usePlanner: (select) => select(store) });
mock('../../src/features/notes/hooks/useMemoActions.ts', {
  useMemoActions: () => ({
    deleteMemos: async (ids) => {
      if (fail) throw Error('write failed');
      deleted = [...ids];
    },
    restoreMemos: async (ids) => {
      if (fail) throw Error('restore failed');
      restored = [...ids];
    },
    saveMemo: async () => {
      if (fail) throw Error('write failed');
    },
  }),
});
const readState = require('../../src/features/notes/hooks/useMemoState.ts').useMemoState;
function render() {
  return hooks.render(readState);
}
async function confirmDelete() {
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  await new Promise((resolve) => setImmediate(resolve));
}
beforeEach(() => {
  hooks.reset();
  dialog = reported = deleted = restored = undefined;
  fail = false;
  store = {
    ready: true,
    restoring: false,
    data: {
      memos: [
        { id: 'a', content: '첫 메모', updatedAt: '2026-11-01T00:00:00Z' },
        { id: 'b', content: '다음 메모', updatedAt: '2026-11-02T00:00:00Z' },
        { id: 'c', content: '보관', updatedAt: '2026-11-03T00:00:00Z' },
      ],
    },
  };
});

test('long press enters selection; taps toggle IDs; confirmed bulk delete exits selection', async () => {
  render().toggleSelection('a');
  assert.equal(render().selecting, true);
  render().toggleSelection('b');
  render().toggleSelection('a');
  assert.deepEqual([...render().selected], ['b']);
  render().toggleSelection('a');
  render().requestDelete();
  assert.equal(deleted, undefined);
  assert.match(dialog.message, /2개/);
  await confirmDelete();
  assert.deepEqual(deleted.sort(), ['a', 'b']);
  assert.equal(render().selecting, false);
  assert.equal(render().selected.size, 0);
});

test('cancellation does not delete and stale IDs are excluded', () => {
  render().toggleSelection('missing');
  assert.equal(render().selected.size, 0);
  render().cancelSelection();
  assert.equal(render().selecting, false);
  assert.equal(deleted, undefined);
});

test('failed deletion keeps selection for retry and reports the error', async () => {
  render().toggleSelection('a');
  fail = true;
  render().requestDelete();
  await confirmDelete();
  assert.match(reported.message, /write failed/);
  assert.equal(render().selecting, true);
  assert.deepEqual([...render().selected], ['a']);
  assert.equal(render().busy, false);
});

test('unsaved editor changes require discard; failed saves retain the draft', async () => {
  render().open(null);
  render().setContent('작성 중');
  render().closeEditor();
  assert.equal(render().editing, null);
  assert.equal(render().content, '작성 중');
  fail = true;
  await render().save();
  assert.equal(render().editing, null);
  assert.equal(render().content, '작성 중');
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  assert.equal(render().editing, undefined);
});

test('restoring data disables editor and selection mutations', () => {
  store.restoring = true;
  render().open(null);
  render().toggleSelection('a');
  assert.equal(render().editing, undefined);
  assert.equal(render().selecting, false);
});

test('editor menu deletes only the open saved memo after confirmation', async () => {
  render().open(store.data.memos[0]);
  render().openEditorMenu();
  assert.equal(render().editorMenuOpen, true);
  render().requestEditorDelete();
  assert.equal(render().editorMenuOpen, false);
  assert.equal(deleted, undefined);
  await confirmDelete();
  assert.deepEqual(deleted, ['a']);
  assert.equal(render().editing, undefined);
});

test('deleting an unsaved draft clears it without deleting persisted memos', async () => {
  render().open(null);
  render().setTitle('작성 중 제목');
  render().setContent('작성 중 본문');
  render().requestEditorDelete();
  await confirmDelete();
  assert.equal(deleted, undefined);
  assert.equal(render().editing, undefined);
  assert.equal(render().title, '');
  assert.equal(render().content, '');
});

test('failed editor deletion reports the error and retains the open draft', async () => {
  render().open(store.data.memos[0]);
  render().setContent('수정 중 본문');
  fail = true;
  render().requestEditorDelete();
  await confirmDelete();
  assert.match(reported.message, /write failed/);
  assert.equal(render().editing.id, 'a');
  assert.equal(render().content, '수정 중 본문');
});

test('list menu opens trash, clears selection, and lists only retained deleted memos', () => {
  const trash = {
    id: 'trash',
    title: '삭제한 메모',
    content: '내용',
    updatedAt: new Date().toISOString(),
    deletedAt: new Date().toISOString(),
  };
  store.data.memos.push(trash, { ...trash, id: 'expired', deletedAt: '2020-01-01T00:00:00Z' });
  assert.equal(render().memos.length, 3);
  render().toggleSelection('a');
  render().openListMenu();
  assert.equal(render().listMenuOpen, true);
  render().openTrash();
  assert.equal(render().listMenuOpen, false);
  assert.equal(render().trashOpen, true);
  assert.equal(render().selecting, false);
  assert.deepEqual(render().memos, [trash]);
  render().closeTrash();
  assert.equal(render().trashOpen, false);
  assert.equal(render().memos.length, 3);
});

test('trash supports individual and bulk restore and a failed restore keeps its preview', async () => {
  const trash = {
    id: 'trash',
    title: '제목',
    content: '본문',
    updatedAt: new Date().toISOString(),
    deletedAt: new Date().toISOString(),
  };
  store.data.memos.push(trash);
  render().openTrash();
  render().open(trash);
  fail = true;
  await render().restore();
  assert.equal(render().editing.id, 'trash');
  assert.match(reported.message, /restore failed/);
  fail = false;
  await render().restore();
  assert.deepEqual(restored, ['trash']);
  assert.equal(render().editing, undefined);
  render().toggleSelection('trash');
  await render().restore();
  assert.deepEqual(restored, ['trash']);
  assert.equal(render().selecting, false);
});
