import { WriteQueue } from '../../../services/WriteQueue';
import { useNotificationStore as ui } from '../../../stores/notifications';
import { initializeNotifications, reportFailure } from './notificationState';

const changes = new WriteQueue();

// 권한 승인과 저장이 끝난 뒤 다음 변경이 최신 설정을 읽는다.
export function runPreferenceChange(action: () => Promise<void>): Promise<void> {
  return changes.enqueue(async () => {
    await initializeNotifications();
    ui.setState({ busy: true, error: null });
    try {
      await action();
    } catch (error) {
      throw reportFailure(error);
    } finally {
      ui.setState({ busy: false });
    }
  });
}
