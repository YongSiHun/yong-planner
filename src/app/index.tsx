import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Label, report, styles, useTheme } from '../components/ui';
import { usePlanner } from '../stores/planner';
import { monthDates, monthLabel, today } from '../utils/date';
import { plansForDate } from '../features/planner/services/plans';
import { DayEditor } from '../features/planner/components/DayEditor';
import { DayRow } from '../features/planner/components/DayRow';
import { PlannerMenu, type PlannerMenuType } from '../features/planner/components/PlannerMenu';
import { useHolidays } from '../features/planner/hooks/useHolidays';
import { useToday } from '../features/planner/hooks/useToday';
import { useMonthNavigation } from '../features/planner/hooks/useMonthNavigation';
import { exportMonth, type ExportFormat } from '../services/export/files';

export default function PlannerScreen() {
  const theme = useTheme();
  const data = usePlanner((state) => state.data);
  const error = usePlanner((state) => state.error);
  const currentDate = useToday();
  const holidays = useHolidays();
  const { month, scrollRef, showDate, handleMonthChange, handleContentSizeChange, handleMeasure } =
    useMonthNavigation();
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [menu, setMenu] = useState<PlannerMenuType | null>(null);
  const dates = monthDates(month);

  function handleDateChange(date: string) {
    setEditingDate(date);
    showDate(date);
  }

  function handleEditorClose() {
    const hasEditingDate = editingDate !== null;

    if (!hasEditingDate) {
      return;
    }

    showDate(editingDate);
    setEditingDate(null);
  }

  function handleRetrySave() {
    void usePlanner.getState().flush().catch(report);
  }

  async function handleExport(format: ExportFormat) {
    try {
      await usePlanner.getState().flush();
      await exportMonth(usePlanner.getState().data, month, format);
      setMenu(null);

      const isClipboard = format === 'clipboard';

      if (isClipboard) {
        Alert.alert('복사 완료', '이번 달 계획을 클립보드에 복사했습니다.');
      }
    } catch (error) {
      report(error);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.bg }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Label muted style={{ letterSpacing: 3, fontSize: 12 }}>
            YONG PLANNER
          </Label>
          <Button title="메뉴" onPress={() => setMenu('menu')} />
        </View>

        <View style={[styles.row, { justifyContent: 'center', marginVertical: 8 }]}>
          <Button title="‹ 이전 달" onPress={() => handleMonthChange(-1)} />
          <Text
            accessibilityRole="header"
            style={{ color: theme.text, fontSize: 26, fontWeight: '700', paddingHorizontal: 8 }}
          >
            {monthLabel(month)}
          </Text>
          <Button title="다음 달 ›" onPress={() => handleMonthChange(1)} />
        </View>

        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Button title="오늘" onPress={() => showDate(today())} />
          <Button title="내보내기 ↗" onPress={() => setMenu('export')} />
        </View>

        {error ? <Button title="저장 실패 · 다시 저장" danger onPress={handleRetrySave} /> : null}
        <View style={{ height: 1, backgroundColor: theme.line, marginTop: 6 }} />
      </View>

      <ScrollView
        key={month.slice(0, 7)}
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 300 }}
        onContentSizeChange={handleContentSizeChange}
      >
        {dates.map((date) => (
          <DayRow
            key={date}
            date={date}
            content={plansForDate(data, date, holidays)
              .map((entry) => entry.content)
              .join(', ')}
            holidayName={holidays.getHolidayName(date)}
            isToday={date === currentDate}
            onEdit={setEditingDate}
            onMeasure={handleMeasure}
          />
        ))}
      </ScrollView>

      {editingDate ? (
        <DayEditor date={editingDate} onDate={handleDateChange} onClose={handleEditorClose} />
      ) : null}
      {menu ? (
        <PlannerMenu
          type={menu}
          month={month}
          onClose={() => setMenu(null)}
          onExport={(format) => {
            void handleExport(format);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
