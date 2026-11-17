import { useMemo, useState } from 'react';
import { usePlanner } from '../../../stores/planner';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { visibleMemos } from '../services/list';
import type { MemoState } from '../types/presentation';
import { useMemoActions } from './useMemoActions';
import { useMemoEditor } from './useMemoEditor';
import { useMemoSelection } from './useMemoSelection';

export function useMemoState(): MemoState {
  const data = usePlanner((state) => state.data.memos);
  const unavailable = usePlanner((state) => state.restoring || !state.ready);
  const error = usePlanner((state) => state.error);
  const [trashOpen, setTrashOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const memos = useMemo(() => visibleMemos(data ?? [], trashOpen), [data, trashOpen]);
  const operation = useAsyncOperation(unavailable);
  const disabled = operation.busy || unavailable;
  const access = { ...operation, disabled };
  const { resetEditor, ...editor } = useMemoEditor(access);
  const { clearSelection, ...selection } = useMemoSelection(memos, access);
  const { restoreMemos } = useMemoActions();

  function showTrash(open: boolean) {
    setListMenuOpen(false);
    selection.cancelSelection();
    setTrashOpen(open);
  }

  async function restore() {
    const ids = editor.editing?.id ? new Set([editor.editing.id]) : selection.selected;

    await operation.run(async () => {
      await restoreMemos(ids);
      resetEditor();
      clearSelection();
    });
  }

  return {
    ...editor,
    ...selection,
    memos,
    error,
    disabled,
    busy: operation.busy,
    trashOpen,
    listMenuOpen,
    restore,
    openTrash: () => showTrash(true),
    closeTrash: () => showTrash(false),
    openListMenu: () => setListMenuOpen(true),
    closeListMenu: () => setListMenuOpen(false),
  };
}
