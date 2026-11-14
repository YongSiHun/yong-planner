import { useMemo } from 'react';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { useSelectionActions } from './useSelectionActions';
import { createSelectedDateIndex, selectedDailyItems } from '../services/selectionProjection';

// 조회 모델 전담; 명령은 Store 구독 없음.
export function useNoteSelection(onBegin: () => void) {
  const active = useNoteSelectionStore((state) => state.active);
  const selected = useNoteSelectionStore((state) => state.selected);
  const data = usePlanner((state) => (selected.size > 0 ? state.data.dailyPlanItems : undefined));
  const items = useMemo(() => selectedDailyItems(data, selected), [data, selected]);
  const indexSelection = useMemo(() => createSelectedDateIndex(), []);
  const selectedByDate = useMemo(() => indexSelection(items), [indexSelection, items]);
  const deleteIds = useNoteSelectionStore((state) => state.deleteIds);
  const timeId = useNoteSelectionStore((state) => state.timeId);
  const copyId = useNoteSelectionStore((state) => state.copyId);
  const copyDates = useNoteSelectionStore((state) => state.copyDates);
  const copySource = items.find((item) => item.id === copyId);
  const timeSource = items.find((item) => item.id === timeId);
  const hasSelectedTime = items.some((item) => Boolean(item.time));
  const sameDate = items.every((item) => item.date === items[0]?.date);
  const copySourceDate = sameDate ? items[0]?.date : undefined;
  const alarmSetting = useNoteSelectionStore((state) => state.alarmSetting);
  const hasSelectedAlarm = items.some((item) => Boolean(item.alarm));
  const allImportant = items.every((item) => item.important);
  const actions = useSelectionActions(onBegin);

  return {
    selectedItems: items,
    selectedByDate,
    alarmSetting,
    hasSelectedAlarm,
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
