import { useCallback } from 'react';
import { emptySelection, useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { dailyNoteItems } from '../services/note';
import { usePlannerActions } from './usePlannerActions';

export function useSelectionActions(
  onBegin: () => void,
  onEdit: (date: string, index: number) => void,
) {
  const { copyDailyNote, deleteDailyNotes, saveDailyTime } = usePlannerActions();
  const clear = useCallback(() => ui.setState(emptySelection()), []);
  const toggle = useCallback(
    (date: string, index: number, begin = false) => {
      const item = dailyNoteItems(usePlanner.getState().data, date)[index];
      const hasItem = item !== undefined;

      if (!hasItem) {
        return;
      }
      onBegin();
      ui.setState({ active: true, selected: toggled(ui.getState().selected, item.id, begin) });
    },
    [onBegin],
  );
  const editSelected = useCallback(() => {
    const data = usePlanner.getState().data;
    const selected = ui.getState().selected;
    const item = data.dailyPlanItems.find((note) => selected.has(note.id));
    const hasSingle = item !== undefined && selected.size === 1;

    if (!hasSingle) {
      return;
    }
    const index = dailyNoteItems(data, item.date).findIndex((note) => note.id === item.id);

    clear();
    onEdit(item.date, index);
  }, [clear, onEdit]);
  const deleteSelected = useCallback(() => {
    const pending = ui.getState().deleteIds;
    const hasPending = pending !== null;

    if (!hasPending) {
      return;
    }
    deleteDailyNotes(pending);
    clear();
  }, [clear, deleteDailyNotes]);
  const copySelected = useCallback(() => {
    const { copyId, copyDates } = ui.getState();
    const hasSource = copyId !== null;

    if (hasSource) {
      copyDailyNote(copyId, [...copyDates].sort());
    }
    clear();
  }, [clear, copyDailyNote]);
  const openCopy = useCallback(() => {
    const selected = ui.getState().selected;
    const isSingle = selected.size === 1;

    if (!isSingle) {
      return;
    }
    ui.setState({ copyId: [...selected][0]!, copyDates: new Set(), active: false });
  }, []);
  const closeCopy = useCallback(
    () =>
      ui.setState({ copyId: null, copyDates: new Set(), active: ui.getState().selected.size > 0 }),
    [],
  );
  const toggleCopyDate = useCallback((date: string) => {
    const state = ui.getState();
    const source = usePlanner
      .getState()
      .data.dailyPlanItems.find((item) => item.id === state.copyId);
    const canCopy = source !== undefined && date !== source.date;

    if (!canCopy) {
      return;
    }
    ui.setState({ copyDates: toggled(state.copyDates, date, false) });
  }, []);
  const saveTime = useCallback(
    (time: string | null) => {
      const id = ui.getState().timeId;
      const hasItem = id !== null;

      if (hasItem) {
        saveDailyTime(id, time);
      }
      clear();
    },
    [clear, saveDailyTime],
  );

  return {
    clear,
    toggle,
    editSelected,
    deleteSelected,
    copySelected,
    openCopy,
    closeCopy,
    toggleCopyDate,
    saveTime,
    requestDelete: useCallback(
      () => ui.setState({ deleteIds: new Set(ui.getState().selected) }),
      [],
    ),
    cancelDelete: useCallback(() => ui.setState({ deleteIds: null }), []),
    openTime: useCallback(
      () => ui.setState({ timeId: [...ui.getState().selected][0] ?? null }),
      [],
    ),
    closeTime: useCallback(() => ui.setState({ timeId: null }), []),
  };
}

function toggled(current: ReadonlySet<string>, id: string, begin: boolean): ReadonlySet<string> {
  const next = new Set(current);
  const shouldRemove = current.has(id) && !begin;

  if (!shouldRemove) {
    next.add(id);

    return next;
  }
  next.delete(id);

  return next;
}
