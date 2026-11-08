export interface NotificationPreferences {
  summary: boolean;
  alarms: boolean;
  lockScreen: boolean;
  exact: boolean;
}
export const defaultNotificationPreferences: NotificationPreferences = {
  summary: false,
  alarms: false,
  lockScreen: true,
  exact: false,
};
export interface NotificationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  exact: boolean;
  sound: boolean;
  lockScreen?: boolean;
}
export interface PlannedNotification {
  id: string;
  kind: 'summary' | 'alarm';
  date: string;
  title: string;
  body: string;
  at: number | null;
}
export interface NotificationPlan {
  summary: PlannedNotification | null;
  pending: PlannedNotification[];
  truncated: boolean;
}
