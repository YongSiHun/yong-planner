import type { Memo, PlannerData } from '../../planner/types';

export const MEMO_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function memoExpired(memo: Memo, now = Date.now()) {
  return memo.deletedAt !== undefined && Date.parse(memo.deletedAt) + MEMO_RETENTION_MS <= now;
}

export function pruneMemoTrash(data: PlannerData, now = Date.now()): PlannerData {
  const memos = data.memos ?? [];
  const retained = memos.filter((memo) => !memoExpired(memo, now));

  return retained.length === memos.length ? data : { ...data, memos: retained };
}
