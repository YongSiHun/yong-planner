import { useLayoutEffect, useState } from 'react';
import { ChipDragSession, type ChipDragSnapshot } from './ChipDragSession';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { dailyNoteItems } from '../services/note';

export function useChipDrag(
  onMove: (from: number, boundary: number) => void,
  count: number,
  date: string,
) {
  const [snapshot, setSnapshot] = useState<ChipDragSnapshot>(null);
  const [session] = useState(
    () =>
      new ChipDragSession(setSnapshot, (index) => {
        const selected = useNoteSelectionStore.getState().selected;
        const item = dailyNoteItems(usePlanner.getState().data, date)[index];

        return selected.size === 1 && selected.has(item?.id ?? '');
      }),
  );

  useLayoutEffect(() => {
    session.setOnMove(onMove);
  }, [onMove, session]);

  useLayoutEffect(() => {
    session.setCount(count);
  }, [count, session]);

  return {
    index: snapshot?.index ?? null,
    box: snapshot?.box,
    offset: session.offset,
    markerOffset: session.markerOffset,
    markerHeight: session.markerHeight,
    handlers: session.pan.panHandlers,
    record: session.record,
    arm: session.arm,
    releaseArm: session.releaseArm,
  };
}
