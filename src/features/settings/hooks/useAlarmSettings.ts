import { useRef, useState } from 'react';
import { report, showDialog, showToast } from '../../../components/ui';
import { useNotificationActions } from '../../notifications/hooks/useNotificationActions';

export function useAlarmSettings() {
  const { clearAlarms } = useNotificationActions();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  async function remove() {
    const inProgress = running.current;

    if (inProgress) {
      return;
    }
    running.current = true;
    setBusy(true);
    try {
      await clearAlarms();
      showToast('모든 알람을 삭제했어요.');
    } catch (error) {
      report(error);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function requestDelete() {
    showDialog(
      '모든 알람 삭제',
      '모든 일정의 알람을 삭제할까요? 일정과 설정된 시간은 유지됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void remove();
          },
        },
      ],
    );
  }

  return { busy, requestDelete };
}
