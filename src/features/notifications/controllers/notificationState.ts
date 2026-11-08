import { useNotificationStore as ui } from '../../../stores/notifications';
import { loadNotificationPreferences } from '../data/preferences';

let initialization: Promise<void> | undefined;

export class PermissionError extends Error {}

export function reportFailure(error: unknown): Error {
  const message =
    error instanceof PermissionError
      ? error.message
      : '알림을 적용하지 못했어요. 앱 업데이트 후 다시 시도해 주세요.';

  ui.setState({ error: message });

  return new Error(message);
}

export function initializeNotifications(): Promise<void> {
  const ready = ui.getState().ready;

  if (ready) {
    return Promise.resolve();
  }
  initialization ??= loadNotificationPreferences()
    .then((preferences) => {
      ui.setState({ preferences, ready: true, error: null });
    })
    .catch((error: unknown) => {
      initialization = undefined;
      throw reportFailure(error);
    });

  return initialization;
}
