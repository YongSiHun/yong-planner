import { showDeleteDialog, showToast } from '../../../components/ui';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { useNotificationActions } from '../../notifications/hooks/useNotificationActions';

export function useAlarmSettings() {
  const { clearAlarms } = useNotificationActions();
  const { busy, run } = useAsyncOperation();

  function requestDelete() {
    showDeleteDialog('모든 일정의 알람을 삭제합니다. 일정과 설정된 시간은 유지됩니다.', () => {
      void run(async () => {
        await clearAlarms();
        showToast('모든 알람을 삭제했어요.');
      });
    });
  }

  return { busy, requestDelete };
}
