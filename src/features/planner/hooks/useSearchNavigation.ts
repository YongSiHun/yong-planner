import { router } from 'expo-router';
import { Keyboard } from 'react-native';
import type { SearchResult } from '../services/search';

export function useSearchNavigation() {
  function openResult(result: SearchResult) {
    Keyboard.dismiss();
    const isMemo = result.memoId !== undefined;

    if (isMemo) {
      router.push({
        pathname: '/notes',
        params: { memoId: result.memoId, memoKey: String(Date.now()) },
      });

      return;
    }
    const isSeries = result.kind === 'recurring';

    if (isSeries) {
      router.push({ pathname: '/recurring', params: { id: result.recurringId } });

      return;
    }
    router.dismissTo({
      pathname: '/',
      params: { searchDate: result.date, searchKey: String(Date.now()) },
    });
  }

  return { openResult };
}
