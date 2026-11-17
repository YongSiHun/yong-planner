import type { Memo } from '../../planner/types';
import { memoExpired } from './trash';

export function visibleMemos(memos: readonly Memo[], trashOpen: boolean, now = Date.now()) {
  return memos
    .filter((memo) => Boolean(memo.deletedAt) === trashOpen && !memoExpired(memo, now))
    .sort((a, b) => (b.deletedAt ?? b.updatedAt).localeCompare(a.deletedAt ?? a.updatedAt));
}
