import { useEffect, useRef } from 'react';
import { parseDate } from '../../../utils/date';

export function useRouteDate(date: unknown, key: unknown, onNavigate: (date: string) => void) {
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => {
    const valid = typeof date === 'string' && typeof key === 'string' && handled.current !== key;

    if (!valid) {
      return;
    }
    handled.current = key;
    try {
      parseDate(date);
      onNavigate(date);
    } catch {}
  }, [date, key, onNavigate]);
}
