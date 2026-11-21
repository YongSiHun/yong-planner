import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router, useRootNavigationState, useNavigationContainerRef } from 'expo-router';
import { parseDate } from '../../../utils/date';
import {
  refreshNotificationPermissions,
  requestStartupNotificationPermission,
  flushEnabledNotifications,
  startNotificationSync,
  subscribeNotificationDates,
} from '../controllers/notifications';

function openDate(value: unknown): void {
  const text = typeof value === 'string';

  if (!text) {
    return;
  }
  try {
    parseDate(value);
    router.push({
      pathname: '/',
      params: { notificationDate: value, notificationKey: String(Date.now()) },
    });
  } catch {}
}
export function useNotificationLifecycle(): void {
  const navigation = useRootNavigationState();
  const navigationRef = useNavigationContainerRef();
  const ready = navigation?.key !== undefined && navigationRef.isReady();

  useEffect(() => {
    if (!ready) {
      return;
    }
    const stop = startNotificationSync();

    let disposed = false;

    void requestStartupNotificationPermission()
      .then(() => {
        if (!disposed) {
          return flushEnabledNotifications();
        }
      })
      .catch(() => {});
    const stopResponses = subscribeNotificationDates(openDate);
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';

      if (active) {
        void refreshNotificationPermissions().catch(() => {});

        return;
      }
      void flushEnabledNotifications().catch(() => {});
    });

    return () => {
      disposed = true;
      stop();
      subscription.remove();
      stopResponses();
    };
  }, [ready]);
}
