import type { NotificationResponse } from 'expo-notifications';
import { NOTIFICATION_PREFIX } from '../services/plan';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router, useRootNavigationState, useNavigationContainerRef } from 'expo-router';
import { parseDate } from '../../../utils/date';
import {
  refreshNotificationPermissions,
  requestStartupNotificationPermission,
  flushEnabledNotifications,
  startNotificationSync,
} from '../controllers/notifications';
import { notificationRuntime } from '../data/native';

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
    let removeResponse: (() => void) | undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';

      if (active) {
        void refreshNotificationPermissions().catch(() => {});

        return;
      }
      void flushEnabledNotifications().catch(() => {});
    });

    void notificationRuntime()
      .then((native) => {
        if (disposed) {
          return;
        }
        const handleResponse = (response: NotificationResponse | null) => {
          const owned = openResponse(response);

          if (owned) {
            native.clearLastNotificationResponse();
          }
        };
        const listener = native.addNotificationResponseReceivedListener(handleResponse);

        removeResponse = () => listener.remove();
        handleResponse(native.getLastNotificationResponse());
      })
      .catch(() => {});

    return () => {
      disposed = true;
      stop();
      subscription.remove();
      removeResponse?.();
    };
  }, [ready]);
}

function openResponse(response: NotificationResponse | null): boolean {
  const hasResponse = response !== null;

  if (!hasResponse) {
    return false;
  }
  const owned = response.notification.request.identifier.startsWith(NOTIFICATION_PREFIX);

  if (!owned) {
    return false;
  }
  openDate(response.notification.request.content.data?.date);

  return true;
}
