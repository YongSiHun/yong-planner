import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Label, styles, useTheme } from '../../../components/ui';
import { monthDates, monthLabel, shiftMonth, today, weekday, weekdays } from '../../../utils/date';
import { plansForDate } from '../services/plans';
import { usePlanner } from '../../../stores/planner';
import { createHolidayService } from '../../../services/holiday';

export function Calendar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect(date: string): void;
}) {
  const [month, setMonth] = useState(selected);
  const theme = useTheme();
  const data = usePlanner((state) => state.data);
  const holidays = useMemo(
    () => createHolidayService(data.holidayOverrides),
    [data.holidayOverrides],
  );
  const dates = monthDates(month);
  const cells = [...Array<string | null>(weekday(dates[0]!)).fill(null), ...dates];

  return (
    <View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Button title="이전 달" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Label>{monthLabel(month)}</Label>
        <Button title="다음 달" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((day, index) => (
          <View key={day} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 8 }}>
            <Label
              style={{ color: index === 0 ? theme.red : index === 6 ? theme.blue : theme.muted }}
            >
              {day}
            </Label>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date, index) => {
          if (!date) return <View key={'blank-' + index} style={{ width: '14.2857%' }} />;
          const holiday = holidays.getHolidayName(date);
          const hasPlan = plansForDate(data, date, holidays).length > 0;
          const day = weekday(date);
          const color = holiday || day === 0 ? theme.red : day === 6 ? theme.blue : theme.text;
          return (
            <View key={date} style={{ width: '14.2857%', padding: 1 }}>
              <Button
                title={String(Number(date.slice(8)))}
                accessibilityLabel={
                  date + (holiday ? ', ' + holiday : '') + (hasPlan ? ', 일정 있음' : '')
                }
                textColor={color}
                selected={date === selected}
                onPress={() => onSelect(date)}
                style={{
                  paddingHorizontal: 0,
                  minWidth: 0,
                  paddingBottom: 14,
                  borderWidth: date === today() ? 1 : 0,
                  borderColor: theme.accent,
                }}
              />
              {hasPlan ? (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    bottom: 7,
                    alignSelf: 'center',
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.accent,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <Button
        title="오늘"
        onPress={() => {
          setMonth(today());
          onSelect(today());
        }}
      />
    </View>
  );
}
