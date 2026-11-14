import { saveMemo, deleteMemo, exportMemos } from '../controllers/notes';

const actions = { saveMemo, deleteMemo, exportMemos };

export function useMemoActions() {
  return actions;
}
