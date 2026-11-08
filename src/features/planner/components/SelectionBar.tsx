import { View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';
import * as styles from './SelectionBar.styles';

export function SelectionBar({
  count,
  onEdit,
  onImportant,
  allImportant = false,
  onCopy,
  onTime,
  onDelete,
  onCancel,
}: {
  count: number;
  onEdit(): void;
  onImportant(): void;
  allImportant?: boolean;
  onCopy(): void;
  onTime(): void;
  onDelete(): void;
  onCancel(): void;
}) {
  const theme = useTheme();
  const hasSelection = count > 0;

  return (
    <View style={styles.container(theme)}>
      <View style={styles.summary}>
        <Label style={styles.count}>{count}개 선택</Label>
        <Button compact title="선택 해제" onPress={onCancel} />
      </View>
      <View style={styles.actions}>
        <Button
          labelSize={design.type.action}
          style={styles.action}
          compact
          bold
          title={allImportant ? '중요 일정 해제' : '중요 일정으로 설정'}
          onPress={onImportant}
        />
        {hasSelection ? (
          <Button
            labelSize={design.type.action}
            style={styles.action}
            compact
            bold
            title="수정하기"
            onPress={onEdit}
          />
        ) : null}
        {hasSelection ? (
          <Button
            labelSize={design.type.action}
            style={styles.action}
            compact
            bold
            title="시간 설정"
            onPress={onTime}
          />
        ) : null}
        {hasSelection ? (
          <Button
            labelSize={design.type.action}
            style={styles.action}
            compact
            bold
            title="일정 복사"
            onPress={onCopy}
          />
        ) : null}
        <Button
          labelSize={design.type.action}
          style={styles.action}
          compact
          bold
          title="삭제하기"
          danger
          disabled={count === 0}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}
