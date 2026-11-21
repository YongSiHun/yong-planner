import type { NotificationResponse } from 'expo-notifications';
import { NOTIFICATION_PREFIX } from './plan';
import { parseDate } from '../../../utils/date';

export function ownedResponse(response: NotificationResponse | null): boolean {
  return response?.notification.request.identifier.startsWith(NOTIFICATION_PREFIX) ?? false;
}

export function notificationResponseDate(response: NotificationResponse): string | null {
  const date = response.notification.request.content.data?.date;
  const text = typeof date === 'string';

  if (!text) {
    return null;
  }
  try {
    parseDate(date);

    return date;
  } catch {
    return null;
  }
}
