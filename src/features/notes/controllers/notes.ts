import { randomUUID } from 'expo-crypto';
import { memoInputError } from '../services/validation';
import { updatePlanner, flushPlanner } from '../../planner/controllers/persistence';
import { usePlanner } from '../../../stores/planner';
import { createNotesBackup } from '../../../services/backup/notes';
import { shareFile } from '../../../services/export/files';

export async function saveMemo(id: string | null, content: string, title?: string) {
  const error = memoInputError(content, title);

  if (error) {
    throw new Error(error);
  }
  const text = content.trim();
  const heading = title?.trim();
  const memo = {
    id: id ?? randomUUID(),
    content: text,
    updatedAt: new Date().toISOString(),
    ...(heading === undefined ? {} : { title: heading }),
  };

  updatePlanner((data) => ({
    ...data,
    memos: [...(data.memos ?? []).filter((item) => item.id !== memo.id), memo],
  }));
  await flushPlanner();
}

export async function deleteMemos(ids: ReadonlySet<string>) {
  updatePlanner((data) => ({
    ...data,
    memos: (data.memos ?? []).filter((item) => !ids.has(item.id)),
  }));
  await flushPlanner();
}

export async function exportMemos() {
  await flushPlanner();
  await shareFile(
    'yongplanner-memos.json',
    createNotesBackup(usePlanner.getState().data),
    'application/json',
  );
}
