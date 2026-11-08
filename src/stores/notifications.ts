import { create } from 'zustand';
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
  type NotificationPermissionState,
} from '../features/notifications/types';

export const useNotificationStore = create<{
  preferences: NotificationPreferences;
  permission: NotificationPermissionState | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  count: number;
  truncated: boolean;
}>(() => ({
  preferences: defaultNotificationPreferences,
  permission: null,
  ready: false,
  busy: false,
  error: null,
  count: 0,
  truncated: false,
}));
