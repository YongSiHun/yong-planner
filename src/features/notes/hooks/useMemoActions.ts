import { saveMemo, deleteMemos, exportMemos } from '../controllers/notes';

const actions = { saveMemo, deleteMemos, exportMemos };

export function useMemoActions() {
  return actions;
}
