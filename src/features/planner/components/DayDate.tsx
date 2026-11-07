import { Keyboard, Pressable, Text, View } from 'react-native';
import { design, useTheme } from '../../../components/ui';
import { weekday, weekdays } from '../../../utils/date';
import { getDateColor } from '../services/presentation';

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
}) {
  const theme = useTheme();
  const hasName = holidayName !== null;
  const color = copyTarget ? theme.onAccent : getDateColor(date, hasName, theme, theme.muted);
  const disabled = copying && copySource;

  function handlePress() {
    if (copying) {
      onCopyDate(date);

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
      accessibilityState={{ checked: copyTarget, disabled }}
      disabled={disabled}
      style={{
        width: 48,
        minHeight: design.touchTarget,
        paddingTop: 9,
        paddingRight: 6,
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-start',
        borderRadius: 6,
        backgroundColor: copyTarget ? theme.accent : 'transparent',
        opacity: copyDateOpacity(disabled),
      }}
    >
      <DateDot visible={hasName} />
      <Text
        maxFontSizeMultiplier={1.4}
        style={{
          color,
          fontSize: design.type.small,
          fontFamily: dateFont(isToday),
          fontVariant: ['tabular-nums'],
          textAlign: 'right',
          width: 20,
        }}
      >
        {Number(date.slice(8))}
      </Text>
      <Text
        maxFontSizeMultiplier={1.4}
        style={{
          color,
          fontFamily: design.font.regular,
          fontSize: design.type.caption,
          paddingTop: 1,
        }}
      >
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

function copyDateOpacity(disabled: boolean) {
  return disabled ? 0.5 : 1;
}

function dateFont(isToday: boolean) {
  return isToday ? design.font.bold : design.font.medium;
}

function DateDot({ visible }: { visible: boolean }) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 3,
        left: 17,
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: theme.accent,
      }}
    />
  );
}
