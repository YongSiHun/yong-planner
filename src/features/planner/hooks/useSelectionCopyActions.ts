import { useCallback } from 'react';
import { useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { toggled } from '../services/selectionSet';
import { usePlannerActions } from './usePlannerActions';

export function useSelectionCopyActions(clear: () => void) {
  const { copyDailyNotes } = usePlannerActions();
  const copySelected = useCallback(() => {
    const { copyId, copyDates } = ui.getState();
    const hasSource = copyId !== null;

    if (hasSource) {
      copyDailyNotes(ui.getState().selected, [...copyDates].sort());
    }
    clear();
  }, [clear, copyDailyNotes]);
  const openCopy = useCallback(() => {
    const selected = ui.getState().selected;
    const hasSelection = selected.size > 0;

    if (!hasSelection) {
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
    const canCopy = usePlanner
      .getState()
      .data.dailyPlanItems.some((item) => state.selected.has(item.id) && item.date !== date);

    if (!canCopy) {
      return;
    }
    ui.setState({ copyDates: toggled(state.copyDates, date, false) });
  }, []);

  return { copySelected, openCopy, closeCopy, toggleCopyDate };
}
