import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { parseDate } from '../../../utils/date';

export function useNotificationDate(onNavigate: (date: string) => void): void {
  const { notificationDate, notificationKey } = useLocalSearchParams<{
    notificationDate?: string;
    notificationKey?: string;
  }>();
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => {
    const valid =
      typeof notificationDate === 'string' &&
      typeof notificationKey === 'string' &&
      handled.current !== notificationKey;

    if (!valid) {
      return;
    }
    handled.current = notificationKey;
    try {
      parseDate(notificationDate);
      onNavigate(notificationDate);
    } catch {}
  }, [notificationDate, notificationKey, onNavigate]);
}
