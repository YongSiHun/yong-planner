import { create } from 'zustand';

export interface NoteSelectionState {
  active: boolean;
  editing: boolean;
  selected: ReadonlySet<string>;
  deleteIds: ReadonlySet<string> | null;
  timeId: string | null;
  copyId: string | null;
  copyDates: ReadonlySet<string>;
}

export function emptySelection(): NoteSelectionState {
  return {
    active: false,
    editing: false,
    selected: new Set(),
    deleteIds: null,
    timeId: null,
    copyId: null,
    copyDates: new Set(),
  };
}

export const useNoteSelectionStore = create<NoteSelectionState>(emptySelection);
