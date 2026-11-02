import { useRef, useState, type ComponentRef } from 'react';
import type { ScrollView } from 'react-native';
import { shiftMonth, today } from '../../../utils/date';

export function useMonthNavigation() {
  const [month, setMonth] = useState(today);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef(new Map<string, number>());
  const pendingDate = useRef<string | null>(today());

  function scrollToDate(date: string, animated = true) {
    const position = positions.current.get(date);
    const hasPosition = position !== undefined;

    if (!hasPosition) {
      return;
    }

    scrollRef.current?.scrollTo({ y: Math.max(0, position - 12), animated });
    pendingDate.current = null;
  }

  function showDate(date: string) {
    pendingDate.current = date;
    const isSameMonth = month.slice(0, 7) === date.slice(0, 7);

    if (isSameMonth) {
      scrollToDate(date);

      return;
    }

    positions.current.clear();
    setMonth(date);
  }

  function handleMonthChange(amount: number) {
    positions.current.clear();
    pendingDate.current = null;
    setMonth(shiftMonth(month.slice(0, 7) + '-01', amount));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleContentSizeChange() {
    const date = pendingDate.current;
    const hasPendingDate = date !== null;

    if (!hasPendingDate) {
      return;
    }

    scrollToDate(date, false);
  }

  function handleMeasure(date: string, position: number) {
    positions.current.set(date, position);
  }

  return { month, scrollRef, showDate, handleMonthChange, handleContentSizeChange, handleMeasure };
}
