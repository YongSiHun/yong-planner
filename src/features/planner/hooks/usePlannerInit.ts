import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePlannerActions } from './usePlannerActions';

export function usePlannerInit(): void {
  const { initialize, flush } = usePlannerActions();

  useEffect(() => {
    void initialize().catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      const isBackground = state !== 'active';

      if (!isBackground) {
        return;
      }
      void flush().catch(() => {});
    });

    return () => subscription.remove();
  }, [initialize, flush]);
}
