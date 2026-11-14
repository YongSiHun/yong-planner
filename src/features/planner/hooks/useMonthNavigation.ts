import { showToast } from '../../../components/ui';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';
import { safeShiftMonth, today } from '../../../utils/date';
import { centeredDateOffset } from '../services/navigation';

interface RowPosition {
  y: number;
  height: number;
}

export function useMonthNavigation() {
  const [month, setMonth] = useState(today);
  const [navigationPadding, setNavigationPadding] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef(new Map<string, RowPosition>());
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const pendingDate = useRef<string | null>(today());

  const scrollToDate = useCallback((date: string, animated = true) => {
    const position = positions.current.get(date);
    const hasLayout =
      position !== undefined && viewportHeight.current > 0 && contentHeight.current > 0;

    if (!hasLayout) {
      return;
    }

    scrollRef.current?.scrollTo({
      y: centeredDateOffset(
        position.y,
        position.height,
        viewportHeight.current,
        contentHeight.current,
      ),
      animated,
    });
    const desired = Math.max(0, position.y - viewportHeight.current * 0.2);
    const maximum = Math.max(0, contentHeight.current - viewportHeight.current);

    pendingDate.current = desired <= maximum ? null : date;
  }, []);

  const finishPendingNavigation = useCallback(() => {
    const date = pendingDate.current;
    const hasPendingDate = date !== null;

    if (hasPendingDate) {
      scrollToDate(date, false);
    }
  }, [scrollToDate]);

  function showDate(date: string) {
    pendingDate.current = date;
    const isSameMonth = month.slice(0, 7) === date.slice(0, 7);

    if (isSameMonth) {
      scrollToDate(date);

      return;
    }

    positions.current.clear();
    contentHeight.current = 0;
    setMonth(date);
  }

  function handleMonthChange(amount: number) {
    const next = safeShiftMonth(month.slice(0, 7) + '-01', amount);

    if (!next) {
      showToast('연도는 1~9999 범위에서 이동할 수 있어요.');

      return;
    }
    positions.current.clear();
    contentHeight.current = 0;
    pendingDate.current = null;
    setMonth(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const handleContentSizeChange = useCallback(
    (_: number, height: number) => {
      contentHeight.current = height;
      finishPendingNavigation();
    },
    [finishPendingNavigation],
  );

  const handleMeasure = useCallback(
    (date: string, y: number, height: number) => {
      positions.current.set(date, { y, height });
      const isPendingDate = pendingDate.current === date;

      if (isPendingDate) {
        finishPendingNavigation();
      }
    },
    [finishPendingNavigation],
  );

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.current = event.nativeEvent.layout.height;
      setNavigationPadding(viewportHeight.current * 0.8);
      finishPendingNavigation();
    },
    [finishPendingNavigation],
  );

  return {
    month,
    navigationPadding,
    scrollRef,
    showDate,
    handleMonthChange,
    handleContentSizeChange,
    handleMeasure,
    handleViewportLayout,
  };
}
