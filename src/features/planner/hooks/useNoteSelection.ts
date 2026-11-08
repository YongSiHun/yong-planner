import { useMemo } from 'react';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { useSelectionActions } from './useSelectionActions';

// 조회 모델 전담; 명령은 Store 구독 없음.
export function useNoteSelection(
  onBegin: () => void,
  onEdit: (date: string, index: number) => void,
) {
  const editing = useNoteSelectionStore((state) => state.editing);
  const active = useNoteSelectionStore((state) => state.active);
  const selected = useNoteSelectionStore((state) => state.selected);
  const data = usePlanner((state) => (selected.size > 0 ? state.data.dailyPlanItems : undefined));
  const items = useMemo(
    () => data?.filter((item) => selected.has(item.id)) ?? [],
    [data, selected],
  );
  const deleteIds = useNoteSelectionStore((state) => state.deleteIds);
  const timeId = useNoteSelectionStore((state) => state.timeId);
  const copyId = useNoteSelectionStore((state) => state.copyId);
  const copyDates = useNoteSelectionStore((state) => state.copyDates);
  const editSources = editing ? items : undefined;
  const copySource = items.find((item) => item.id === copyId);
  const timeSource = items.find((item) => item.id === timeId);
  const hasSelectedTime = items.some((item) => Boolean(item.time));
  const sameDate = items.every((item) => item.date === items[0]?.date);
  const copySourceDate = sameDate ? items[0]?.date : undefined;
  const alarmSetting = useNoteSelectionStore((state) => state.alarmSetting);
  const allAlarm = items.length > 0 && items.every((item) => item.alarm);
  const allImportant = items.every((item) => item.important);
  const actions = useSelectionActions(onBegin, onEdit);

  return {
    editSources,
    alarmSetting,
    allAlarm,
    hasSelectedTime,
    allImportant,
    copySourceDate,
    active,
    selected,
    copySource,
    timeSource,
    copyDates,
    deleteCount: deleteIds?.size ?? 0,
    ...actions,
  };
}
