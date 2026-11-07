import { useNoteSelection } from '../features/planner/hooks/useNoteSelection';
import { PlannerFooter } from '../features/planner/components/PlannerFooter';
import { PlannerDialogs } from '../features/planner/components/PlannerDialogs';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, design, report, useTheme } from '../components/ui';
import { usePlanner } from '../stores/planner';
import { monthDates, today } from '../utils/date';
import { plansForDate } from '../features/planner/services/plans';
import { NOTE_SEPARATOR } from '../features/planner/services/note';
import { DayRow } from '../features/planner/components/DayRow';
import { usePlannerGuide } from '../features/planner/hooks/usePlannerGuide';
import { PlannerHeader } from '../features/planner/components/PlannerHeader';
import { type PlannerMenuType } from '../features/planner/components/PlannerMenu';
import { useHolidays } from '../features/planner/hooks/useHolidays';
import { useToday } from '../features/planner/hooks/useToday';
import { useInlineKeyboard } from '../features/planner/hooks/useInlineKeyboard';
import { useMonthNavigation } from '../features/planner/hooks/useMonthNavigation';
import { exportMonth, type ExportFormat } from '../services/export/files';

export default function PlannerScreen() {
  const theme = useTheme();
  const data = usePlanner((state) => state.data);
  const error = usePlanner((state) => state.error);
  const currentDate = useToday();
  const holidays = useHolidays();
  const {
    month,
    scrollRef,
    showDate,
    handleMonthChange,
    handleContentSizeChange,
    handleMeasure,
    handleViewportLayout,
  } = useMonthNavigation();
  const { keyboardVisible, handleInputFocus, scheduleReveal, handleKeyboardScroll } =
    useInlineKeyboard(scrollRef, month.slice(0, 7));
  const guide = usePlannerGuide();
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [menu, setMenu] = useState<PlannerMenuType | null>(null);
  const dates = useMemo(() => monthDates(month), [month]);
  const days = useMemo(
    () =>
      dates.map((date) => {
        const entries = plansForDate(data, date, holidays);

        return {
          date,
          noteTimes: entries.filter((entry) => entry.kind === 'daily').map((entry) => entry.time),
          noteIds: entries.filter((entry) => entry.kind === 'daily').map((entry) => entry.sourceId),
          note: entries
            .filter((entry) => entry.kind === 'daily')
            .map((entry) => entry.content)
            .join(NOTE_SEPARATOR),
          recurring: entries.filter((entry) => entry.kind === 'recurring'),
          exceptions: data.recurringPlanExceptions.filter((item) => item.date === date),
          holidayName: holidays.getHolidayName(date),
        };
      }),
    [data, dates, holidays],
  );
  const beginSelection = useCallback(() => {
    Keyboard.dismiss();
    setEditingDate(null);
  }, []);
  const editSelection = useCallback(
    (date: string, index: number) => {
      showDate(date);
      setEditingIndex(index);
      setEditingDate(date);
    },
    [showDate],
  );
  const selection = useNoteSelection(beginSelection, editSelection);
  const handleEditDate = useCallback((date: string) => {
    setEditingIndex(undefined);
    setEditingDate(date);
  }, []);

  const finishEditing = useCallback((date: string) => {
    setEditingDate((current) => (current === date ? null : current));
  }, []);

  function handleRetrySave() {
    void usePlanner.getState().flush().catch(report);
  }

  function handleToday() {
    Keyboard.dismiss();
    selection.clear();
    showDate(today());
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          width: '100%',
          maxWidth: 960,
          alignSelf: 'center',
        }}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <PlannerHeader
          month={month}
          onMonth={handleMonthChange}
          onChooseMonth={() => setMonthPickerOpen(true)}
          onMenu={() => setMenu('menu')}
          onGuide={guide.openGuide}
        />
        {error ? (
          <Button compact title="저장 실패 · 다시 저장" danger onPress={handleRetrySave} />
        ) : null}
        <ScrollView
          key={month.slice(0, 7)}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
          overScrollMode="never"
          onLayout={handleViewportLayout}
          onScroll={handleKeyboardScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: design.space.xs,
            paddingBottom: selection.active || selection.copySource ? 12 : 76,
          }}
          onContentSizeChange={(width, height) => {
            handleContentSizeChange(width, height);
            scheduleReveal();
          }}
        >
          {days.map((day) => (
            <DayRow
              key={day.date}
              {...day}
              timeFormat={data.settings.timeFormat ?? '24h'}
              isToday={day.date === currentDate}
              isEditing={editingDate === day.date}
              editingIndex={editingDate === day.date ? editingIndex : undefined}
              selectedIds={selection.selected}
              selecting={selection.active}
              copying={selection.copySource !== undefined}
              copyTarget={selection.copyDates.has(day.date)}
              copySourceDate={selection.copySource?.date}
              onCopyDate={selection.toggleCopyDate}
              onSelect={selection.toggle}
              onEdit={handleEditDate}
              onFinish={finishEditing}
              onMeasure={handleMeasure}
              onInputFocus={handleInputFocus}
              onInputLayout={scheduleReveal}
            />
          ))}
        </ScrollView>
        <PlannerFooter
          selection={selection}
          keyboardVisible={keyboardVisible}
          onToday={handleToday}
        />
        <PlannerDialogs
          guide={guide}
          selection={selection}
          timeFormat={data.settings.timeFormat ?? '24h'}
          monthPickerOpen={monthPickerOpen}
          month={month}
          menu={menu}
          onCloseMonth={() => setMonthPickerOpen(false)}
          onChooseMonth={(date) => {
            Keyboard.dismiss();
            setEditingDate(null);
            setMonthPickerOpen(false);
            showDate(date);
          }}
          onCloseMenu={() => setMenu(null)}
          onShowExport={() => setMenu('export')}
          onExport={(format) => {
            void handleExport(format);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
