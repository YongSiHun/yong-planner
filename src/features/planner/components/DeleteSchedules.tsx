import { View } from 'react-native';
import { Button, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import * as styles from './DeleteSchedules.styles';

export function DeleteSchedules({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel(): void;
  onConfirm(): void;
}) {
  const theme = useTheme();

  return (
    <Dialog
      title="삭제하시겠습니까?"
      onClose={onCancel}
      footer={
        <View style={styles.deleteSchedulesViewStyle}>
          <Button title="취소" onPress={onCancel} style={styles.deleteSchedulesButtonStyle} />
          <Button
            title="삭제"
            bold
            onPress={onConfirm}
            textColor={theme.onAccent}
            style={styles.deleteSchedulesButtonStyle2(theme)}
          />
        </View>
      }
    >
      <Label muted>선택한 일정 {count}개를 삭제합니다.</Label>
    </Dialog>
  );
}
