import { saveMemo, deleteMemos, restoreMemos, purgeMemoTrash } from '../controllers/notes';

const actions = { saveMemo, deleteMemos, restoreMemos, purgeMemoTrash };

export function useMemoActions() {
  return actions;
}
