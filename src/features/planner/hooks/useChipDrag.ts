import { useLayoutEffect, useState } from 'react';
import { ChipDragSession, type ChipDragSnapshot } from './ChipDragSession';

export function useChipDrag(onMove: (from: number, boundary: number) => void, count: number) {
  const [snapshot, setSnapshot] = useState<ChipDragSnapshot>(null);
  const [session] = useState(() => new ChipDragSession(setSnapshot));

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
    handlers: session.pan.panHandlers,
    record: session.record,
    arm: session.arm,
    releaseArm: session.releaseArm,
  };
}
