import { useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { usePlanner } from '../../../stores/planner';
import { memoExpired } from '../services/trash';
import type { useMemoState } from './useMemoState';

export function useMemoRoute(state: ReturnType<typeof useMemoState>) {
  const { memoId, memoKey } = useLocalSearchParams<{ memoId?: string; memoKey?: string }>();
  const handled = useRef<string | undefined>(undefined);
  const { open, openTrash, closeTrash, disabled } = state;

  useEffect(() => {
    const pending = typeof memoId === 'string' && memoKey !== handled.current && !disabled;

    if (!pending) {
      return;
    }
    const memo = findMemo(memoId);

    handled.current = memoKey;
    const unavailable = memo === undefined;

    if (unavailable) {
      return;
    }
    openMemo(memo, open, openTrash, closeTrash);
  }, [memoId, memoKey, open, openTrash, closeTrash, disabled]);
}

function findMemo(id: string) {
  return usePlanner.getState().data.memos?.find((memo) => memo.id === id && !memoExpired(memo));
}

function openMemo(
  memo: NonNullable<ReturnType<typeof findMemo>>,
  open: ReturnType<typeof useMemoState>['open'],
  openTrash: () => void,
  closeTrash: () => void,
) {
  const trashed = memo.deletedAt !== undefined;

  const showList = trashed ? openTrash : closeTrash;

  showList();
  open(memo);
}
