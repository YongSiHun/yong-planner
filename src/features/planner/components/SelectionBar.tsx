import { ScrollView, View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';
import * as styles from './SelectionBar.styles';

export function SelectionBar({
  count,
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
      <View style={styles.summary}>
        <Label style={styles.count}>{count}개 선택</Label>
        <Button
          labelSize={design.type.small}
          style={styles.cancel}
          compact
          bold
          title="전체 선택 해제"
          onPress={onCancel}
        />
      </View>
      <ScrollView
        horizontal
        style={styles.viewport}
        contentContainerStyle={styles.actions}
        showsHorizontalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title={allImportant ? '중요 일정 해제' : '중요 일정 등록'}
          accessibilityLabel={allImportant ? '중요 일정 해제' : '중요 일정 등록'}
          selected={allImportant}
          onPress={onImportant}
        />

        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="시간 설정"
          accessibilityLabel="시간 설정"
          onPress={onTime}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="일정 복사"
          accessibilityLabel="일정 복사"
          onPress={onCopy}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title={allAlarm ? '알람 해제' : '알람 설정'}
          accessibilityLabel={allAlarm ? '알람 해제' : '알람 설정'}
          selected={allAlarm}
          disabled={!hasSelection}
          onPress={onAlarm}
        />
        <Button
          labelSize={design.type.body}
          style={styles.action}
          compact
          bold
          title="삭제"
          accessibilityLabel="삭제"
          danger
          disabled={count === 0}
          onPress={onDelete}
        />
      </ScrollView>
    </View>
  );
}
