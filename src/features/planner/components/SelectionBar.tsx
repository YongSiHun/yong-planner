import { ScrollView, View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';
import * as styles from './SelectionBar.styles';

export function SelectionBar({
  count,
  onEdit,
  onImportant,
  allImportant = false,
  onCopy,
  onTime,
  onAlarm,
  allAlarm = false,
  onDelete,
  onCancel,
}: {
  count: number;
  onEdit(): void;
  onImportant(): void;
  allImportant?: boolean;
  onCopy(): void;
  onTime(): void;
  onAlarm(): void;
  allAlarm?: boolean;
  onDelete(): void;
  onCancel(): void;
}) {
  const theme = useTheme();
  const hasSelection = count > 0;

  return (
    <View style={styles.container(theme)}>
      <ScrollView
        horizontal
        style={styles.viewport}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actions}
      >
        <Label style={styles.count}>{count}개 선택</Label>
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="선택 해제"
          onPress={onCancel}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title={allImportant ? '중요 일정 해제' : '중요 일정으로 설정'}
          onPress={onImportant}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="수정하기"
          onPress={onEdit}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="시간 설정"
          onPress={onTime}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="일정 복사"
          onPress={onCopy}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title={allAlarm ? '알람 해제' : '알람 설정'}
          disabled={!hasSelection}
          onPress={onAlarm}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="삭제하기"
          danger
          disabled={count === 0}
          onPress={onDelete}
        />
      </ScrollView>
    </View>
  );
}
