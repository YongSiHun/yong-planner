import { randomUUID } from 'expo-crypto';
import { updatePlanner, flushPlanner } from '../../planner/controllers/persistence';
import { usePlanner } from '../../../stores/planner';
import { createNotesBackup } from '../../../services/backup/notes';
import { shareFile } from '../../../services/export/files';

export async function saveMemo(id: string | null, content: string) {
  const text = content.trim();
  const invalid = text.length === 0 || text.length > 100000;

  if (invalid) {
    throw new Error('메모는 1~100,000자여야 합니다.');
  }
  const memo = { id: id ?? randomUUID(), content: text, updatedAt: new Date().toISOString() };

  updatePlanner((data) => ({
    ...data,
    memos: [...(data.memos ?? []).filter((item) => item.id !== memo.id), memo],
  }));
  await flushPlanner();
}

export async function deleteMemo(id: string) {
  updatePlanner((data) => ({
    ...data,
    memos: (data.memos ?? []).filter((item) => item.id !== id),
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
