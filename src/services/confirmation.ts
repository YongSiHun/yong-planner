import type { DialogRequest } from '../stores/dialog';

export function deleteConfirmation(
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): DialogRequest {
  return {
    title: '삭제하시겠습니까?',
    message,
    actions: [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '삭제', style: 'destructive', onPress: onConfirm },
    ],
  };
}
