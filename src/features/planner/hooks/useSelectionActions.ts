import { useCallback, useRef } from 'react';
import { report } from '../../../components/ui';
import { authorizeScheduleAlarm } from '../../notifications/controllers/notifications';
import { emptySelection, useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { dailyNoteItems } from '../services/note';
import { usePlannerActions } from './usePlannerActions';

export function useSelectionActions(
  onBegin: () => void,
  onEdit: (date: string, index: number) => void,
) {
  const {
    copyDailyNotes,
    deleteDailyNotes,
    saveDailyTimes,
    saveDailyContents,
    setDailyImportant,
    setDailyAlarms,
  } = usePlannerActions();
  const savingAlarm = useRef(false);
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
    const multiple = selected.size > 1;

    if (multiple) {
      ui.setState({ editing: true });

      return;
    }
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
  const saveAlarm = useCallback(
    async (time: string | null) => {
      const unavailable = !time || savingAlarm.current;

      if (unavailable) {
        return;
      }
      const selected = new Set(ui.getState().selected);

      savingAlarm.current = true;
      try {
        await authorizeScheduleAlarm();
        setDailyAlarms(selected, true, time);
        clear();
      } catch (error) {
        report(error);
      } finally {
        savingAlarm.current = false;
      }
    },
    [clear, setDailyAlarms],
  );
  const saveTime = useCallback(
    (time: string | null) => {
      const alarmSetting = ui.getState().alarmSetting;

      if (alarmSetting) {
        void saveAlarm(time);

        return;
      }
      const id = ui.getState().timeId;
      const hasItem = id !== null;

      if (hasItem) {
        saveDailyTimes(ui.getState().selected, time);
      }
      clear();
    },
    [clear, saveDailyTimes, saveAlarm],
  );

  return {
    clear,
    toggleImportant: useCallback(() => {
      const selected = ui.getState().selected;
      const items = usePlanner
        .getState()
        .data.dailyPlanItems.filter((item) => selected.has(item.id));
      const important = items.some((item) => !item.important);

      setDailyImportant(selected, important);
      clear();
    }, [clear, setDailyImportant]),
    closeEdit: useCallback(() => ui.setState({ editing: false }), []),
    saveContents: useCallback(
      (changes: ReadonlyMap<string, string>) => {
        saveDailyContents(changes);
        clear();
      },
      [clear, saveDailyContents],
    ),
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
      () => ui.setState({ timeId: [...ui.getState().selected][0] ?? null, alarmSetting: false }),
      [],
    ),
    toggleAlarm: useCallback(() => {
      const selected = ui.getState().selected;
      const items = usePlanner
        .getState()
        .data.dailyPlanItems.filter((item) => selected.has(item.id));

      const empty = items.length === 0;

      if (empty) {
        return;
      }
      const allAlarm = items.every((item) => item.alarm);

      if (allAlarm) {
        setDailyAlarms(selected, false);
        clear();

        return;
      }
      ui.setState({ timeId: items[0]!.id, alarmSetting: true });
    }, [clear, setDailyAlarms]),
    closeTime: useCallback(() => ui.setState({ timeId: null, alarmSetting: false }), []),
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
