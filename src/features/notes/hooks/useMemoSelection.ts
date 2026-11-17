import { useState } from 'react';
import { showDeleteDialog } from '../../../components/ui';
import { toggled } from '../../../utils/selection';
import type { Memo } from '../../planner/types';
import type { MemoOperation } from '../types/presentation';
import { useMemoActions } from './useMemoActions';

export function useMemoSelection(
  memos: readonly Memo[],
  { disabled, isRunning, run }: MemoOperation,
) {
  const { deleteMemos } = useMemoActions();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const selected = new Set(memos.filter((memo) => selectedIds.has(memo.id)).map((memo) => memo.id));

  function clearSelection() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function cancelSelection() {
    const running = isRunning();

    if (!running) {
      clearSelection();
    }
  }

  function toggleSelection(id: string) {
    if (disabled) {
      return;
    }
    setSelecting(true);
    setSelectedIds((current) => toggled(current, id));
  }

  function requestDelete() {
    const cannotDelete = disabled || selected.size === 0;

    if (cannotDelete) {
      return;
    }
    const ids = new Set(selected);

    showDeleteDialog(
      '선택한 메모 ' + ids.size + '개를 휴지통으로 이동합니다. 30일 동안 복구할 수 있어요.',
      () => {
        void run(async () => {
          await deleteMemos(ids);
          clearSelection();
        });
      },
    );
  }

  return { selecting, selected, toggleSelection, cancelSelection, clearSelection, requestDelete };
}
