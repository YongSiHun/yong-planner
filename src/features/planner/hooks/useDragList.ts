import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  Keyboard,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from 'react-native';
import { moveEntry } from '../services/order';
import {
  calculateDrag,
  getScrollDirection,
  getScrollOffset,
  type DragBounds,
  type DragSession,
  type DragVisual,
  type RowGeometry,
} from '../services/drag';

export function useDragList<T>(
  items: T[],
  getItemId: (item: T) => string,
  onOrder: (items: T[]) => void,
) {
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const bounds = useRef<DragBounds>({ top: 0, height: 0 });
  const rows = useRef(new Map<string, RowGeometry>());
  const scrollOffset = useRef(0);
  const contentHeight = useRef(0);
  const activeSession = useRef<DragSession | null>(null);
  const latest = useRef({ items, getItemId, onOrder });

  useLayoutEffect(() => {
    latest.current = { items, getItemId, onOrder };
  }, [items, getItemId, onOrder]);

  const [visual, setVisual] = useState<DragVisual | null>(null);
  const isDragging = visual !== null;

  const updateDrag = useCallback(() => {
    const session = activeSession.current;
    const hasSession = session !== null;

    if (!hasSession) {
      return;
    }

    const current = latest.current;
    const nextVisual = calculateDrag(
      current.items,
      current.getItemId,
      rows.current,
      session,
      scrollOffset.current,
    );
    const hasVisual = nextVisual !== null;

    if (!hasVisual) {
      return;
    }

    session.target = nextVisual.target;
    setVisual(nextVisual);
  }, []);

  const autoScroll = useCallback(() => {
    const session = activeSession.current;
    const hasSession = session !== null;

    if (!hasSession) {
      return;
    }

    const direction = getScrollDirection(session.pointer, bounds.current);
    const nextOffset = getScrollOffset(
      scrollOffset.current,
      direction,
      contentHeight.current,
      bounds.current.height,
    );
    const canScroll = direction !== 0 && nextOffset !== scrollOffset.current;

    if (!canScroll) {
      return;
    }

    scrollOffset.current = nextOffset;
    scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
    updateDrag();
  }, [updateDrag]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const interval = setInterval(autoScroll, 40);

    return () => clearInterval(interval);
  }, [isDragging, autoScroll]);

  const handleMeasure = useCallback(() => {
    rootRef.current?.measureInWindow((_, top, __, height) => {
      bounds.current = { top, height };
    });
  }, []);

  const handleStart = useCallback(
    (index: number) => {
      Keyboard.dismiss();
      handleMeasure();
      activeSession.current = {
        index,
        startOffset: scrollOffset.current,
        dy: 0,
        pointer: bounds.current.top + bounds.current.height / 2,
        target: index,
      };
      setVisual({ index, dy: 0, target: index });
    },
    [handleMeasure],
  );

  const handleMove = useCallback(
    (pointer: number, delta: number) => {
      const session = activeSession.current;
      const hasSession = session !== null;

      if (!hasSession) {
        return;
      }

      session.pointer = pointer;
      session.dy = delta;
      updateDrag();
    },
    [updateDrag],
  );

  const handleCancel = useCallback(() => {
    activeSession.current = null;
    setVisual(null);
  }, []);

  const handleEnd = useCallback(() => {
    const session = activeSession.current;

    handleCancel();

    const hasSession = session !== null;

    if (!hasSession) {
      return;
    }

    const hasMoved = session.index !== session.target;

    if (!hasMoved) {
      return;
    }

    const current = latest.current;

    current.onOrder(moveEntry(current.items, session.index, session.target));
  }, [handleCancel]);

  const handleAccessibleMove = useCallback((index: number, direction: number) => {
    const current = latest.current;
    const target = index + direction;
    const canMove = target >= 0 && target < current.items.length;

    if (!canMove) {
      return;
    }

    current.onOrder(moveEntry(current.items, index, target));
  }, []);

  const handleRowLayout = useCallback((id: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;

    rows.current.set(id, { y, height });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleContentSizeChange = useCallback((_: number, height: number) => {
    contentHeight.current = height;
  }, []);

  return {
    rootRef,
    scrollRef,
    visual,
    isDragging,
    handleMeasure,
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    handleAccessibleMove,
    handleRowLayout,
    handleScroll,
    handleContentSizeChange,
  };
}
