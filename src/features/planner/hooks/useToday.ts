import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { today } from '../../../utils/date';

export function useToday(): string {
  const [currentDate, setCurrentDate] = useState(today);

  useEffect(() => {
    const refreshToday = () => setCurrentDate(today());
    const interval = setInterval(refreshToday, 60000);
    const subscription = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active';

      if (!isActive) {
        return;
      }

      refreshToday();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return currentDate;
}
