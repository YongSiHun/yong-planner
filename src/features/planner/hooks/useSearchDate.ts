import { useLocalSearchParams } from 'expo-router';
import { useRouteDate } from './useRouteDate';

export function useSearchDate(onNavigate: (date: string) => void) {
  const { searchDate, searchKey } = useLocalSearchParams<{
    searchDate?: string;
    searchKey?: string;
  }>();

  useRouteDate(searchDate, searchKey, onNavigate);
}
