import {
  saveMemo,
  deleteMemos,
  restoreMemos,
  purgeMemoTrash,
  exportMemos,
} from '../controllers/notes';

const actions = { saveMemo, deleteMemos, restoreMemos, purgeMemoTrash, exportMemos };

export function useMemoActions() {
  return actions;
}
