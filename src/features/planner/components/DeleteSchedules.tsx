import { View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';
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
        <View style={styles.actions}>
          <Button
            title="취소"
            bold
            labelSize={design.type.action}
            onPress={onCancel}
            textColor={theme.accent}
            style={styles.action}
          />
          <Button
            title="삭제"
            bold
            labelSize={design.type.action}
            onPress={onConfirm}
            textColor={theme.red}
            style={styles.action}
          />
        </View>
      }
    >
      <Label style={styles.message(theme)}>선택한 일정 {count}개를 삭제합니다.</Label>
    </Dialog>
  );
}
