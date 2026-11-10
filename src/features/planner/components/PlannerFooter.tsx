import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import type { NoteSelectionModel } from '../types/presentation';
import { CopyBar } from './CopyBar';
import * as styles from './PlannerFooter.styles';
import { SelectionBar } from './SelectionBar';

export function PlannerFooter({
  selection,
  keyboardVisible,
  onToday,
}: {
  selection: NoteSelectionModel;
  month: string;
  keyboardVisible: boolean;
  onToday(): void;
}) {
  const source = selection.copySource;
  const isCopying = source !== undefined;

  if (isCopying) {
    return (
      <CopyBar
        content={source.content}
        count={selection.copyDates.size}
        onCopy={selection.copySelected}
        onCancel={selection.closeCopy}
      />
    );
  }
  const isSelecting = selection.active;

  if (isSelecting) {
    return (
      <SelectionBar
        count={selection.selected.size}
        onImportant={selection.toggleImportant}
        allImportant={selection.allImportant}
        onCopy={selection.openCopy}
        onTime={selection.openTime}
        onAlarm={selection.toggleAlarm}
        onDelete={selection.requestDelete}
      />
    );
  }
  if (keyboardVisible) {
    return null;
  }

  return <TodayButton onPress={onToday} />;
}

function TodayButton({ onPress }: { onPress(): void }) {
  const theme = useTheme();

  return (
    <View pointerEvents="box-none" style={styles.todayButtonViewStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="오늘 날짜로 이동"
        onPress={onPress}
        style={styles.todayButtonPressableStyle(theme)}
      >
        <Text style={styles.todayButtonTextStyle(theme)}>오늘 날짜로 이동</Text>
      </Pressable>
    </View>
  );
}
