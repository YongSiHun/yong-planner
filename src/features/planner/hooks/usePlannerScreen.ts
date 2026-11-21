import { useEffect, useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { report, showDialog } from '../../../components/ui';
import type { ExportFormat } from '../../../services/export/types';
import { usePlanner } from '../../../stores/planner';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { monthDates, today } from '../../../utils/date';
import type { PlannerMenuType } from '../types/presentation';
import { useEditingActions } from './useEditingActions';
import { useNotificationDate } from './useNotificationDate';
import { useSearchDate } from './useSearchDate';
import { useExportActions } from './useExportActions';
import { useHolidays } from './useHolidays';
import { useInlineKeyboard } from '../../../hooks/useInlineKeyboard';
import { useMonthNavigation } from './useMonthNavigation';
import { useNoteSelection } from './useNoteSelection';
import { usePlannerActions } from './usePlannerActions';
import { usePlannerGuide } from './usePlannerGuide';
import { useToday } from './useToday';

export function usePlannerScreen() {
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

  const handleChipScrollLock = useCallback(
    (locked: boolean) => {
      scrollRef.current?.setNativeProps({ scrollEnabled: !locked });
    },
    [scrollRef],
  );

  useNotificationDate(showDate);
  useSearchDate(showDate);
  const { keyboardVisible, handleInputFocus, scheduleReveal, handleKeyboardScroll } =
    useInlineKeyboard(scrollRef, month.slice(0, 7));
  const guide = usePlannerGuide();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const { closePlannerEditor } = useEditingActions();

  useEffect(() => closePlannerEditor, [closePlannerEditor]);
  const [menu, setMenu] = useState<PlannerMenuType | null>(null);
  const dates = useMemo(() => monthDates(month), [month]);
  const beginSelection = useCallback(() => {
    Keyboard.dismiss();
    closePlannerEditor();
  }, [closePlannerEditor]);
  const selection = useNoteSelection(beginSelection);
  const { clear: clearSelection } = selection;
  const dismissSelection = useCallback(() => {
    Keyboard.dismiss();
    const active = useNoteSelectionStore.getState().active;

    if (active) {
      clearSelection();
    }
  }, [clearSelection]);

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

  return {
    timeFormat,
    error,
    currentDate,
    holidays,
    month,
    scrollRef,
    showDate,
    handleMonthChange,
    handleContentSizeChange,
    handleMeasure,
    handleViewportLayout,
    handleChipScrollLock,
    keyboardVisible,
    handleInputFocus,
    scheduleReveal,
    handleKeyboardScroll,
    guide,
    monthPickerOpen,
    setMonthPickerOpen,
    closePlannerEditor,
    menu,
    setMenu,
    dates,
    selection,
    dismissSelection,
    handleRetrySave,
    handleToday,
    handleExport,
  };
}
