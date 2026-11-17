import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { deleteConfirmation } from '../../../services/confirmation';

export function DeleteSchedules({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel(): void;
  onConfirm(): void;
}) {
  const request = deleteConfirmation(
    '선택한 일정 ' + count + '개를 삭제합니다.',
    onConfirm,
    onCancel,
  );

  return <ConfirmationDialog {...request} onChoose={(action) => action?.onPress?.()} />;
}
