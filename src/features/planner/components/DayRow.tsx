import { memo } from 'react';
import { Pressable, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../../components/ui';
import { weekday, weekdays } from '../../../utils/date';
import { getDateColor } from '../services/presentation';

interface DayRowProps {
  date: string;
  content: string;
  holidayName: string | null;
  isToday: boolean;
  onEdit(date: string): void;
  onMeasure(date: string, position: number): void;
}

export const DayRow = memo(function DayRow({
  date,
  content,
  holidayName,
  isToday,
  onEdit,
  onMeasure,
}: DayRowProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const day = weekday(date);
  const hasHoliday = holidayName !== null;
  const color = getDateColor(date, hasHoliday, theme, theme.text);
  const holidayDescription = hasHoliday ? ', ' + holidayName : '';
  const accessibilityLabel =
    date + ' ' + weekdays[day] + '요일' + holidayDescription + ', ' + content + ', 편집';

  function handlePress() {
    onEdit(date);
  }

  function handleLayout(event: LayoutChangeEvent) {
    onMeasure(date, event.nativeEvent.layout.y);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onLayout={handleLayout}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 60,
        paddingVertical: 15,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: isToday || pressed ? theme.selected : 'transparent',
      })}
    >
      <View style={{ width: 60 * fontScale, flexDirection: 'row', gap: 7, paddingRight: 6 }}>
        <Text
          style={{
            color,
            fontSize: 17,
            lineHeight: 27,
            width: 25 * fontScale,
            textAlign: 'right',
            fontVariant: ['tabular-nums'],
          }}
        >
          {Number(date.slice(8))}
        </Text>
        <Text style={{ color, fontSize: 16, lineHeight: 27 }}>{weekdays[day]}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 17, lineHeight: 27 }}>{content}</Text>
        {hasHoliday ? (
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{holidayName}</Text>
        ) : null}
      </View>
    </Pressable>
  );
});
