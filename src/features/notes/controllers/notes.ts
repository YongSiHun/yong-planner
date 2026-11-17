import { memoExpired, pruneMemoTrash } from '../services/trash';
import { randomUUID } from 'expo-crypto';
import { memoInputError } from '../services/validation';
import { updatePlanner, flushPlanner } from '../../planner/controllers/persistence';

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

  updatePlanner((data) => {
    const trashed = data.memos?.some((item) => item.id === memo.id && item.deletedAt !== undefined);

    if (trashed) {
      throw new Error('휴지통의 메모는 복구 후 수정해 주세요.');
    }

    return { ...data, memos: [...(data.memos ?? []).filter((item) => item.id !== memo.id), memo] };
  });
  await flushPlanner();
}

export async function deleteMemos(ids: ReadonlySet<string>) {
  const deletedAt = new Date().toISOString();

  updatePlanner((data) => ({
    ...data,
    memos: (data.memos ?? []).map((item) =>
      ids.has(item.id) && !item.deletedAt ? { ...item, deletedAt } : item,
    ),
  }));
  await flushPlanner();
}

export async function restoreMemos(ids: ReadonlySet<string>) {
  updatePlanner((data) => ({
    ...data,
    memos: (data.memos ?? [])
      .filter((item) => !memoExpired(item))
      .map((item) => {
        const restoring = ids.has(item.id) && item.deletedAt !== undefined;

        if (!restoring) {
          return item;
        }
        const { deletedAt: _deletedAt, ...memo } = item;

        return memo;
      }),
  }));
  await flushPlanner();
}

export async function purgeMemoTrash() {
  updatePlanner(pruneMemoTrash);
  await flushPlanner();
}
