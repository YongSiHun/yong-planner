import { useEffect } from 'react';
import { useNotificationStore } from '../../../stores/notifications';
import { useNotificationActions } from './useNotificationActions';

export function useNotificationSettings() {
  const preferences = useNotificationStore((state) => state.preferences);
  const permission = useNotificationStore((state) => state.permission);
  const ready = useNotificationStore((state) => state.ready);
  const busy = useNotificationStore((state) => state.busy);
  const error = useNotificationStore((state) => state.error);
  const count = useNotificationStore((state) => state.count);
  const truncated = useNotificationStore((state) => state.truncated);
  const actions = useNotificationActions();

  useEffect(() => {
    void actions.refresh();
  }, [actions]);

  return { preferences, permission, ready, busy, error, count, truncated, ...actions };
}
