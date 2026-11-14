import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { parseDate } from '../../../utils/date';

export function useSearchDate(onNavigate: (date: string) => void) {
  const { searchDate, searchKey } = useLocalSearchParams<{
    searchDate?: string;
    searchKey?: string;
  }>();
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => {
    const valid =
      typeof searchDate === 'string' &&
      typeof searchKey === 'string' &&
      handled.current !== searchKey;

    if (!valid) {
      return;
    }
    handled.current = searchKey;
    try {
      parseDate(searchDate);
      onNavigate(searchDate);
    } catch {}
  }, [searchDate, searchKey, onNavigate]);
}
