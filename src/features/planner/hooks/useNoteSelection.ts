import { useCallback, useState } from 'react';
import { dailyNoteItems } from '../services/note';
import {
  copyDailyNote,
  deleteDailyNotes,
  saveDailyTime,
  usePlanner,
} from '../../../stores/planner';

export function useNoteSelection(
  onBegin: () => void,
  onEdit: (date: string, index: number) => void,
) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [timeId, setTimeId] = useState<string | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [copyDates, setCopyDates] = useState<ReadonlySet<string>>(new Set());
  const data = usePlanner((state) => state.data);
  const copySource = data.dailyPlanItems.find((item) => item.id === copyId);
  const timeSource = data.dailyPlanItems.find((item) => item.id === timeId);

  const toggle = useCallback(
    (date: string, index: number, begin = false) => {
      const item = dailyNoteItems(usePlanner.getState().data, date)[index];
      const hasItem = item !== undefined;

      if (!hasItem) {
        return;
      }
      onBegin();
      setActive(true);
      setSelected((current) => toggleSelection(current, item.id, begin));
    },
    [onBegin],
  );

  const clear = useCallback(() => {
    setSelected(new Set());
    setActive(false);
    setCopyId(null);
    setCopyDates(new Set());
    setTimeId(null);
  }, []);

  function editSelected() {
    const item = data.dailyPlanItems.find((note) => selected.has(note.id));
    const hasSingle = item !== undefined && selected.size === 1;

    if (!hasSingle) {
      return;
    }
    const index = dailyNoteItems(data, item.date).findIndex((note) => note.id === item.id);

    clear();
    onEdit(item.date, index);
  }

  function deleteSelected() {
    deleteDailyNotes(selected);
    clear();
  }

  function copySelected() {
    const hasSource = copyId !== null;

    if (hasSource) {
      copyDailyNote(copyId, [...copyDates].sort());
    }
    setCopyId(null);
    clear();
  }

  function openCopy() {
    const isSingle = selected.size === 1;

    if (!isSingle) {
      return;
    }
    setCopyId([...selected][0]!);
    setCopyDates(new Set());
    setActive(false);
  }

  function closeCopy() {
    setCopyId(null);
    setCopyDates(new Set());
    setActive(selected.size > 0);
  }

  function toggleCopyDate(date: string) {
    const canCopy = copySource !== undefined && date !== copySource.date;

    if (canCopy) {
      setCopyDates((current) => toggleSelection(current, date, false));
    }
  }

  function saveTime(time: string | null) {
    const hasItem = timeId !== null;

    if (hasItem) {
      saveDailyTime(timeId, time);
    }
    setTimeId(null);
    clear();
  }

  return {
    active,
    selected,
    toggle,
    clear,
    editSelected,
    deleteSelected,
    timeSource,
    saveTime,
    openTime: () => setTimeId([...selected][0] ?? null),
    closeTime: () => setTimeId(null),
    copySource,
    copyDates,
    toggleCopyDate,
    copySelected,
    openCopy,
    closeCopy,
  };
}

function toggleSelection(
  current: ReadonlySet<string>,
  id: string,
  begin: boolean,
): ReadonlySet<string> {
  const next = new Set(current);
  const shouldRemove = current.has(id) && !begin;

  if (shouldRemove) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
}
