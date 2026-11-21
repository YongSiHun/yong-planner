import type { NotificationResponse } from 'expo-notifications';
import { notificationRuntime } from '../data/native';
import { notificationResponseDate, ownedResponse } from '../services/response';

export function subscribeNotificationDates(onDate: (date: string) => void): () => void {
  let disposed = false;
  let remove: (() => void) | undefined;

  void notificationRuntime()
    .then((native) => {
      if (disposed) {
        return;
      }
      const handle = (response: NotificationResponse | null) => {
        const owned = !disposed && ownedResponse(response);

        if (!owned) {
          return;
        }
        const date = notificationResponseDate(response!);

        if (date) {
          onDate(date);
        }
        native.clearLastNotificationResponse();
      };
      const listener = native.addNotificationResponseReceivedListener(handle);

      remove = () => listener.remove();
      handle(native.getLastNotificationResponse());
    })
    .catch(() => {});

  return () => {
    disposed = true;
    remove?.();
  };
}
