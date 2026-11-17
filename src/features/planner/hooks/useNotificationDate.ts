import { useLocalSearchParams } from 'expo-router';
import { useRouteDate } from './useRouteDate';

export function useNotificationDate(onNavigate: (date: string) => void) {
  const { notificationDate, notificationKey } = useLocalSearchParams<{
    notificationDate?: string;
    notificationKey?: string;
  }>();

  useRouteDate(notificationDate, notificationKey, onNavigate);
}
