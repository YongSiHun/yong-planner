require('../support/register.cjs');
const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');
const React = require('react');
const { createModuleMock } = require('../support/mock-module.cjs');
const mock = createModuleMock(require);
let slots, cursor, dialog, reported, deleted, fail, store;
mock('react', {
  ...React,
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [
      slots[index],
      (next) => {
        slots[index] = typeof next === 'function' ? next(slots[index]) : next;
      },
    ];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
});
mock('../../src/components/ui/index.tsx', {
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
    saveMemo: async () => {
      if (fail) throw Error('write failed');
    },
  }),
});
const readState = require('../../src/features/notes/hooks/useMemoState.ts').useMemoState;
function render() {
  cursor = 0;
  return readState();
}
async function confirmDelete() {
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  await new Promise((resolve) => setImmediate(resolve));
}
beforeEach(() => {
  slots = [];
  cursor = 0;
  dialog = reported = deleted = undefined;
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

test('select all toggles; cancellation does not delete and stale IDs are excluded', () => {
  render().startSelection();
  render().selectAll();
  assert.equal(render().selected.size, 3);
  render().selectAll();
  assert.equal(render().selected.size, 0);
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
  await render().run(render().save);
  assert.equal(render().editing, null);
  assert.equal(render().content, '작성 중');
  dialog.actions.find((action) => action.style === 'destructive').onPress();
  assert.equal(render().editing, undefined);
});

test('restoring data disables editor and selection mutations', () => {
  store.restoring = true;
  render().open(null);
  render().toggleSelection('a');
  render().startSelection();
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
