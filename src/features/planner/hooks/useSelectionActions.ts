import { useCallback } from 'react';
import { emptySelection, useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { dailyNoteItems } from '../services/note';
import { toggled } from '../services/selectionSet';
import { usePlannerActions } from './usePlannerActions';
import { useSelectionCopyActions } from './useSelectionCopyActions';
import { useSelectionTimeActions } from './useSelectionTimeActions';

export function useSelectionActions(onBegin: () => void) {
  const { deleteDailyNotes, setDailyImportant } = usePlannerActions();
  const clear = useCallback(() => ui.setState(emptySelection()), []);
  const copy = useSelectionCopyActions(clear);
  const time = useSelectionTimeActions(clear);
  const toggle = useCallback(
    (date: string, index: number, begin = false) => {
      const item = dailyNoteItems(usePlanner.getState().data, date)[index];
      const hasItem = item !== undefined;

      if (!hasItem) {
        return;
      }
      const selected = toggled(ui.getState().selected, item.id, begin);
      const hasSelection = selected.size > 0;

      if (!hasSelection) {
        clear();

        return;
      }
      onBegin();
      ui.setState({ active: true, selected });
    },
    [clear, onBegin],
  );
  const deleteSelected = useCallback(() => {
    const pending = ui.getState().deleteIds;
    const hasPending = pending !== null;

    if (!hasPending) {
      return;
    }
    deleteDailyNotes(pending);
    clear();
  }, [clear, deleteDailyNotes]);

  return {
    ...copy,
    ...time,
    clear,
    selectAll: useCallback(
      (month: string) => {
        const items = usePlanner.getState().data.dailyPlanItems;
        const selected = new Set(
          items
            .filter((item) => item.date.slice(0, 7) === month.slice(0, 7))
            .map((item) => item.id),
        );
        const hasSelection = selected.size > 0;

        if (!hasSelection) {
          return;
        }
        onBegin();
        ui.setState({ ...emptySelection(), active: true, selected });
      },
      [onBegin],
    ),
    toggleImportant: useCallback(() => {
      const selected = ui.getState().selected;
      const items = usePlanner
        .getState()
        .data.dailyPlanItems.filter((item) => selected.has(item.id));
      const important = items.some((item) => !item.important);

      setDailyImportant(selected, important);
      clear();
    }, [clear, setDailyImportant]),
    toggle,
    deleteSelected,
    requestDelete: useCallback(
      () => ui.setState({ deleteIds: new Set(ui.getState().selected) }),
      [],
    ),
    cancelDelete: useCallback(() => ui.setState({ deleteIds: null }), []),
  };
}
