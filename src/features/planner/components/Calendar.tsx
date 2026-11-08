import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Label, showToast, useTheme } from '../../../components/ui';
import type { HolidayService } from '../../../services/holiday';
import { usePlanner } from '../../../stores/planner';
import {
  monthDates,
  monthLabel,
  safeShiftMonth,
  today,
  weekday,
  weekdays,
} from '../../../utils/date';
import { useHolidays } from '../hooks/useHolidays';
import { hasPlansForDate } from '../services/plans';
import { getDateColor } from '../services/presentation';
import type { PlannerData } from '../types';
import * as styles from './Calendar.styles';

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
    <View style={styles.weekdayHeadingViewStyle}>
      <Label style={styles.weekdayHeadingLabelStyle(color)}>{weekdays[day]}</Label>
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
  const hasPlan = hasPlansForDate(data, date, holidays);
  const holidayDescription = isHoliday ? ', ' + holidayName : '';
  const planDescription = hasPlan ? ', 일정 있음' : '';
  const color = getDateColor(date, isHoliday, theme, theme.text);

  return (
    <View style={styles.calendarDateViewStyle}>
      <Button
        title={String(Number(date.slice(8)))}
        accessibilityLabel={date + holidayDescription + planDescription}
        textColor={color}
        selected={date === selected}
        onPress={() => onSelect(date)}
        style={styles.calendarDateButtonStyle(isToday, theme)}
      />

      {hasPlan ? <View pointerEvents="none" style={styles.calendarDateViewStyle2(theme)} /> : null}
    </View>
  );
}

function CalendarCell({ date, index, ...props }: CalendarCellProps) {
  const hasDate = date !== null;

  if (!hasDate) {
    return <View key={'blank-' + index} style={styles.calendarCellViewStyle} />;
  }

  return <CalendarDate date={date} {...props} />;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  const [month, setMonth] = useState(selected);
  const data = usePlanner((state) => state.data);
  const holidays = useHolidays();
  const dates = useMemo(() => monthDates(month), [month]);
  const cells = [...Array<string | null>(weekday(dates[0]!)).fill(null), ...dates];

  function handleMonthChange(amount: number) {
    const next = safeShiftMonth(month, amount);

    if (!next) {
      showToast('연도는 1~9999 범위에서 이동할 수 있어요.');

      return;
    }
    setMonth(next);
  }

  function handleTodayPress() {
    const currentDate = today();

    setMonth(currentDate);
    onSelect(currentDate);
  }

  return (
    <View>
      <View style={styles.calendarViewStyle}>
        <Button title="이전 달" onPress={() => handleMonthChange(-1)} />
        <Label>{monthLabel(month)}</Label>
        <Button title="다음 달" onPress={() => handleMonthChange(1)} />
      </View>

      <View style={styles.calendarViewStyle2}>
        {weekdays.map((label, day) => (
          <WeekdayHeading key={label} day={day} />
        ))}
      </View>

      <View style={styles.calendarViewStyle3}>
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
