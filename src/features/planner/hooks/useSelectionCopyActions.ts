import { useCallback } from 'react';
import { showToast } from '../../../components/ui';
import {
  COPY_DUPLICATE_MESSAGE,
  COPY_SINGLE_MESSAGE,
  hasCopyConflict,
} from '../services/copyTargets';
import { useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { toggled } from '../services/selectionSet';
import { usePlannerActions } from './usePlannerActions';

export function useSelectionCopyActions(clear: () => void) {
  const { copyDailyNotes } = usePlannerActions();
  const copySelected = useCallback(() => {
    const { copyId, copyDates } = ui.getState();
    const hasSource = copyId !== null;

    try {
      if (hasSource) {
        copyDailyNotes(new Set([copyId!]), [...copyDates].sort());
      }
      clear();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '일정을 복사하지 못했어요.');
    }
  }, [clear, copyDailyNotes]);
  const openCopy = useCallback(() => {
    const selected = ui.getState().selected;
    const hasSingleSelection = selected.size === 1;

    if (!hasSingleSelection) {
      showToast(COPY_SINGLE_MESSAGE);

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
    const conflict =
      !state.copyDates.has(date) &&
      hasCopyConflict(usePlanner.getState().data, state.selected, date);

    if (conflict) {
      showToast(COPY_DUPLICATE_MESSAGE);

      return;
    }
    ui.setState({ copyDates: toggled(state.copyDates, date, false) });
  }, []);

  return { copySelected, openCopy, closeCopy, toggleCopyDate };
}
