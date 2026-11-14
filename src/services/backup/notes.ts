import { emptyData, type PlannerData } from '../../features/planner/types';
import { validateData } from './validation';

export function createNotesBackup(data: PlannerData): string {
  const validated = validateData(data);

  return JSON.stringify(
    {
      version: 6,
      kind: 'notes',
      exportedAt: new Date().toISOString(),
      ...emptyData(),
      memos: validated.memos,
    },
    null,
    2,
  );
}

export function mergeNotesBackup(current: PlannerData, backup: PlannerData): PlannerData {
  const incoming = new Map((backup.memos ?? []).map((memo) => [memo.id, memo]));
  const existing = (current.memos ?? []).filter((memo) => !incoming.has(memo.id));

  return validateData({ ...current, memos: [...existing, ...incoming.values()] });
}
