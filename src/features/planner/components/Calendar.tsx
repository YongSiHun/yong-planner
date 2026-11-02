import { useState } from 'react';
import { View } from 'react-native';
import { Button, Label, styles, useTheme } from '../../../components/ui';
import { monthDates, monthLabel, shiftMonth, today, weekday, weekdays } from '../../../utils/date';
import { plansForDate } from '../services/plans';
import { getDateColor } from '../services/presentation';
import { usePlanner } from '../../../stores/planner';
import { useHolidays } from '../hooks/useHolidays';
import type { HolidayService } from '../../../services/holiday';
import type { PlannerData } from '../types';

interface CalendarProps {
  selected: string;
  onSelect(date: string): void;
}
interface CalendarCellProps extends CalendarProps {
  date: string | null;
  index: number;
  data: PlannerData;
  holidays: HolidayService;
}

function WeekdayHeading({ day }: { day: number }) {
  const theme = useTheme();
  const weekendColors: Record<number, string> = { 0: theme.red, 6: theme.blue };
  const color = weekendColors[day] ?? theme.muted;

  return (
    <View style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 8 }}>
      <Label style={{ color }}>{weekdays[day]}</Label>
    </View>
  );
}

function CalendarDate({
  date,
  selected,
  data,
  holidays,
  onSelect,
}: Omit<CalendarCellProps, 'index' | 'date'> & { date: string }) {
  const theme = useTheme();
  const holidayName = holidays.getHolidayName(date);
  const isHoliday = holidayName !== null;
  const isToday = date === today();
  const hasPlan = plansForDate(data, date, holidays).length > 0;
  const holidayDescription = isHoliday ? ', ' + holidayName : '';
  const planDescription = hasPlan ? ', 일정 있음' : '';
  const color = getDateColor(date, isHoliday, theme, theme.text);

  return (
    <View style={{ width: '14.2857%', padding: 1 }}>
      <Button
        title={String(Number(date.slice(8)))}
        accessibilityLabel={date + holidayDescription + planDescription}
        textColor={color}
        selected={date === selected}
        onPress={() => onSelect(date)}
        style={{
          paddingHorizontal: 0,
          minWidth: 0,
          paddingBottom: 14,
          borderWidth: isToday ? 1 : 0,
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
}

function CalendarCell({ date, index, ...props }: CalendarCellProps) {
  const hasDate = date !== null;

  if (!hasDate) {
    return <View key={'blank-' + index} style={{ width: '14.2857%' }} />;
  }

  return <CalendarDate date={date} {...props} />;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  const [month, setMonth] = useState(selected);
  const data = usePlanner((state) => state.data);
  const holidays = useHolidays();
  const dates = monthDates(month);
  const cells = [...Array<string | null>(weekday(dates[0]!)).fill(null), ...dates];

  function handleTodayPress() {
    const currentDate = today();

    setMonth(currentDate);
    onSelect(currentDate);
  }

  return (
    <View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Button title="이전 달" onPress={() => setMonth(shiftMonth(month, -1))} />
        <Label>{monthLabel(month)}</Label>
        <Button title="다음 달" onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((label, day) => (
          <WeekdayHeading key={label} day={day} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date, index) => (
          <CalendarCell
            key={date ?? 'blank-' + index}
            date={date}
            index={index}
            selected={selected}
            onSelect={onSelect}
            data={data}
            holidays={holidays}
          />
        ))}
      </View>

      <Button title="오늘" onPress={handleTodayPress} />
    </View>
  );
}
