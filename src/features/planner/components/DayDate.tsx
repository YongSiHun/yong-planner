import { Keyboard, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { weekday, weekdays } from '../../../utils/date';
import { getDateColor } from '../services/presentation';
import * as styles from './DayDate.styles';

export function DayDate({
  date,
  holidayName,
  isToday,
  copying,
  copyTarget,
  copySource,
  onCopyDate,
  onFinish,
  onInfo,
  selecting = false,
  onOutsidePress,
}: {
  date: string;
  holidayName: string | null;
  isToday: boolean;
  copying: boolean;
  copyTarget: boolean;
  copySource: boolean;
  onCopyDate(date: string): void;
  onFinish(date: string): void;
  onInfo(): void;
  selecting?: boolean;
  onOutsidePress?(): void;
}) {
  const theme = useTheme();
  const hasName = holidayName !== null;
  const color = copyTarget ? theme.onAccent : getDateColor(date, hasName, theme, theme.muted);
  const mutedSource = copying && copySource;

  function handlePress() {
    if (copying) {
      onCopyDate(date);

      return;
    }
    const active = selecting || useNoteSelectionStore.getState().active;

    if (active) {
      onOutsidePress?.();

      return;
    }
    Keyboard.dismiss();
    onFinish(date);
    if (hasName) {
      onInfo();
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole={copying ? 'checkbox' : 'button'}
      accessibilityLabel={dateLabel(date, copying, holidayName)}
      accessibilityState={{ checked: copyTarget }}
      style={styles.dayDatePressableStyle(copyTarget, theme, mutedSource)}
    >
      <DateDot visible={hasName} />
      <Text maxFontSizeMultiplier={1.4} style={styles.dayDateTextStyle(color, isToday)}>
        {Number(date.slice(8))}
      </Text>
      <Text maxFontSizeMultiplier={1.4} style={styles.dayDateTextStyle2(color)}>
        {weekdays[weekday(date)]}
      </Text>
    </Pressable>
  );
}

function dateLabel(date: string, copying: boolean, name: string | null) {
  if (copying) {
    return date + ', 복사할 날짜 선택';
  }
  const hasName = name !== null;

  return hasName
    ? date + ', ' + name + ', 날짜 정보 보기'
    : date + ' ' + weekdays[weekday(date)] + '요일, 키보드 닫기';
}

function DateDot({ visible }: { visible: boolean }) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return <View pointerEvents="none" style={styles.dateDotViewStyle(theme)} />;
}
