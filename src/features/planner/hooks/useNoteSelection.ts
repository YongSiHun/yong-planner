import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { useSelectionActions } from './useSelectionActions';

// 조회 모델 전담; 명령은 Store 구독 없음.
export function useNoteSelection(
  onBegin: () => void,
  onEdit: (date: string, index: number) => void,
) {
  const active = useNoteSelectionStore((state) => state.active);
  const selected = useNoteSelectionStore((state) => state.selected);
  const deleteIds = useNoteSelectionStore((state) => state.deleteIds);
  const timeId = useNoteSelectionStore((state) => state.timeId);
  const copyId = useNoteSelectionStore((state) => state.copyId);
  const copyDates = useNoteSelectionStore((state) => state.copyDates);
  const copySource = usePlanner((state) =>
    state.data.dailyPlanItems.find((item) => item.id === copyId),
  );
  const timeSource = usePlanner((state) =>
    state.data.dailyPlanItems.find((item) => item.id === timeId),
  );
  const actions = useSelectionActions(onBegin, onEdit);

  return {
    active,
    selected,
    copySource,
    timeSource,
    copyDates,
    deleteCount: deleteIds?.size ?? 0,
    ...actions,
  };
}
