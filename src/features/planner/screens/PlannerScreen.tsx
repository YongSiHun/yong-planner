import { useNotificationDate } from '../hooks/useNotificationDate';
import { useCallback, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, report, showDialog, useTheme } from '../../../components/ui';
import { type ExportFormat } from '../../../services/export/files';
import { usePlanner } from '../../../stores/planner';
import { monthDates, today } from '../../../utils/date';
import { PlannerDay } from '../components/PlannerDay';
import { PlannerDialogs } from '../components/PlannerDialogs';
import { PlannerFooter } from '../components/PlannerFooter';
import { PlannerHeader } from '../components/PlannerHeader';
import { type PlannerMenuType } from '../components/PlannerMenu';
import { useExportActions } from '../hooks/useExportActions';
import { useHolidays } from '../hooks/useHolidays';
import { useInlineKeyboard } from '../../../hooks/useInlineKeyboard';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import { useNoteSelection } from '../hooks/useNoteSelection';
import { usePlannerActions } from '../hooks/usePlannerActions';
import { usePlannerGuide } from '../hooks/usePlannerGuide';
import { useToday } from '../hooks/useToday';
import * as styles from './PlannerScreen.styles';

export default function PlannerScreen() {
  const theme = useTheme();
  const timeFormat = usePlanner((state) => state.data.settings.timeFormat ?? '24h');
  const { flush } = usePlannerActions();
  const { exportMonth } = useExportActions();
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

  useNotificationDate(showDate);
  const { keyboardVisible, handleInputFocus, scheduleReveal, handleKeyboardScroll } =
    useInlineKeyboard(scrollRef, month.slice(0, 7));
  const guide = usePlannerGuide();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [menu, setMenu] = useState<PlannerMenuType | null>(null);
  const dates = useMemo(() => monthDates(month), [month]);
  const beginSelection = useCallback(() => {
    Keyboard.dismiss();
    setEditingDate(null);
  }, []);
  const selection = useNoteSelection(beginSelection);
  const { active: isSelecting, clear: clearSelection } = selection;
  const dismissSelection = useCallback(() => {
    if (isSelecting) {
      clearSelection();
    }
  }, [isSelecting, clearSelection]);
  const handleEditDate = useCallback((date: string) => {
    setEditingDate(date);
  }, []);

  const finishEditing = useCallback((date: string) => {
    setEditingDate((current) => (current === date ? null : current));
  }, []);

  function handleRetrySave() {
    void flush().catch(report);
  }

  function handleToday() {
    Keyboard.dismiss();
    selection.clear();
    showDate(today());
  }

  async function handleExport(format: ExportFormat) {
    try {
      await exportMonth(month, format);
      setMenu(null);
      const isClipboard = format === 'clipboard';

      if (isClipboard) {
        showDialog('복사 완료', '이번 달 계획을 클립보드에 복사했습니다.', undefined, {
          dismissOnPress: true,
        });
      }
    } catch (error) {
      report(error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.plannerScreenKeyboardAvoidingViewStyle(theme)}
      behavior="padding"
    >
      <Pressable accessible={false} onPress={dismissSelection} style={styles.surface}>
        <SafeAreaView
          style={styles.plannerScreenSafeAreaViewStyle(theme)}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={styles.frame}>
            <PlannerHeader
              month={month}
              onMonth={(amount) => {
                dismissSelection();
                handleMonthChange(amount);
              }}
              onChooseMonth={() => {
                dismissSelection();
                setMonthPickerOpen(true);
              }}
              onMenu={() => {
                dismissSelection();
                setMenu('menu');
              }}
              onGuide={() => {
                dismissSelection();
                guide.openGuide();
              }}
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
              onLayout={(event) => {
                handleViewportLayout(event);
                scheduleReveal();
              }}
              onScroll={handleKeyboardScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.plannerScreenScrollViewContentContainerStyle(
                selection.active,
                selection.copySource !== undefined,
              )}
              onContentSizeChange={(width, height) => {
                handleContentSizeChange(width, height);
                scheduleReveal();
              }}
            >
              {dates.map((date) => (
                <PlannerDay
                  key={date}
                  date={date}
                  holidays={holidays}
                  timeFormat={timeFormat}
                  isToday={date === currentDate}
                  isEditing={editingDate === date}
                  selectedIds={selection.selected}
                  selecting={selection.active}
                  copying={selection.copySource !== undefined}
                  copyTarget={selection.copyDates.has(date)}
                  copySourceDate={selection.copySourceDate}
                  onCopyDate={selection.toggleCopyDate}
                  onSelect={selection.toggle}
                  onOutsidePress={dismissSelection}
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
              month={month}
              keyboardVisible={keyboardVisible}
              onToday={handleToday}
            />
            <PlannerDialogs
              guide={guide}
              selection={selection}
              timeFormat={timeFormat}
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
          </View>
        </SafeAreaView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
