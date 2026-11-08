import { memo, useCallback, useState } from 'react';
import { Keyboard, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Button, report, useTheme } from '../../../components/ui';
import { usePlannerActions } from '../hooks/usePlannerActions';
import type { DayRowProps } from '../types/presentation';
import { DateInfo } from './DateInfo';
import { DayDate } from './DayDate';
import * as styles from './DayRow.styles';
import { DraggableSchedulePreview } from './DraggableSchedulePreview';
import { RecurringNote } from './RecurringNote';
import { ScheduleInput } from './ScheduleInput';

export const DayRow = memo(function DayRow({
  date,
  note,
  noteIds,
  noteTimes = [],
  noteImportant = [],
  timeFormat = '24h',
  selectedIds,
  selecting,
  copying,
  copyTarget,
  copySourceDate,
  onCopyDate,
  editingIndex,
  onSelect,
  onOutsidePress,
  recurring,
  exceptions,
  holidayName,
  isToday,
  isEditing,
  onEdit,
  onFinish,
  onMeasure,
  onInputFocus,
  onInputLayout,
}: DayRowProps) {
  const theme = useTheme();
  const { saveException, flush, moveDailyNote } = usePlannerActions();
  const handleMove = useCallback(
    (from: number, boundary: number) => moveDailyNote(date, from, boundary),
    [date, moveDailyNote],
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<number | undefined>();
  const selectedIndexes = new Set(
    noteIds.flatMap((id, index) => (selectedIds.has(id) ? [index] : [])),
  );
  const [initialIndex, setInitialIndex] = useState<number | undefined>();

  function startEditing(index?: number) {
    setInitialSlot(undefined);
    setInitialIndex(index);
    onEdit(date);
  }

  function startInsertion(boundary: number) {
    setInitialSlot(boundary);
    setInitialIndex(undefined);
    onEdit(date);
  }

  function handleDayPress() {
    if (copying) {
      onCopyDate(date);

      return;
    }
    onOutsidePress?.();
    Keyboard.dismiss();
  }

  function handleBlur() {
    onFinish(date);
    void flush().catch(report);
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { y, height: rowHeight } = event.nativeEvent.layout;

    onMeasure(date, y, rowHeight);
  }

  return (
    <Pressable
      accessible={false}
      onPress={handleDayPress}
      onLayout={handleLayout}
      style={styles.screenPressableStyle(theme, isToday)}
    >
      <DayDate
        date={date}
        holidayName={holidayName}
        onInfo={() => setInfoOpen(true)}
        isToday={isToday}
        selecting={selecting}
        onOutsidePress={onOutsidePress}
        copying={copying}
        copyTarget={copyTarget}
        copySource={copySourceDate === date}
        onCopyDate={onCopyDate}
        onFinish={onFinish}
      />
      <View pointerEvents={bodyPointerEvents(copying)} style={styles.screenViewStyle}>
        {isEditing ? (
          <ScheduleInput
            date={date}
            note={note}
            noteTimes={noteTimes}
            noteImportant={noteImportant}
            timeFormat={timeFormat}
            initialIndex={editingIndex ?? initialIndex}
            initialSlot={getInitialSlot(editingIndex, initialSlot)}
            onSelect={(index, begin) => onSelect(date, index, begin)}
            onBlur={handleBlur}
            onEditPart={startEditing}
            onInputFocus={onInputFocus}
            onInputLayout={onInputLayout}
          />
        ) : (
          <DraggableSchedulePreview
            onMove={handleMove}
            onOutsidePress={onOutsidePress}
            date={date}
            note={note}
            noteTimes={noteTimes}
            noteImportant={noteImportant}
            timeFormat={timeFormat}
            onEdit={startEditing}
            onInsert={startInsertion}
            selecting={selecting}
            selectedIndexes={selectedIndexes}
            onSelect={(index, begin) => onSelect(date, index, begin)}
          />
        )}
        {recurring.map((entry) => (
          <RecurringNote
            key={entry.id}
            entry={entry}
            date={date}
            onInputFocus={onInputFocus}
            onInputLayout={onInputLayout}
          />
        ))}
        {exceptions.map((exception) => (
          <View key={exception.recurringPlanId} style={styles.screenViewStyle2}>
            <Text style={styles.screenTextStyle(theme)}>
              {exception.cancelled ? '취소한 반복 일정' : '수정한 반복 일정'}
            </Text>
            <Button
              compact
              title="원래대로"
              onPress={() => {
                Keyboard.dismiss();
                saveException(exception.recurringPlanId, date, null);
              }}
            />
          </View>
        ))}
      </View>
      {infoOpen ? (
        <DateInfo date={date} name={holidayName ?? ''} onClose={() => setInfoOpen(false)} />
      ) : null}
    </Pressable>
  );
}, areDayRowsEqual);

function sameItems<T>(before: T[], after: T[], keys: (keyof T)[]): boolean {
  return (
    before.length === after.length &&
    before.every((item, index) => keys.every((key) => item[key] === after[index]![key]))
  );
}

function areDayRowsEqual(before: DayRowProps, after: DayRowProps): boolean {
  const keys = [
    'date',
    'note',
    'timeFormat',
    'selectedIds',
    'selecting',
    'copying',
    'copyTarget',
    'copySourceDate',
    'onCopyDate',
    'editingIndex',
    'onSelect',
    'onOutsidePress',
    'holidayName',
    'isToday',
    'isEditing',
    'onEdit',
    'onFinish',
    'onMeasure',
    'onInputFocus',
    'onInputLayout',
  ] as const;
  const sameValues = keys.every((key) => before[key] === after[key]);
  const sameRecurring = sameItems(before.recurring, after.recurring, [
    'id',
    'sourceId',
    'content',
    'time',
  ]);
  const sameExceptions = sameItems(before.exceptions, after.exceptions, [
    'recurringPlanId',
    'date',
    'cancelled',
    'title',
    'time',
  ]);

  const sameNoteIds =
    before.noteIds.length === after.noteIds.length &&
    before.noteIds.every(
      (id, index) =>
        id === after.noteIds[index] &&
        before.noteTimes[index] === after.noteTimes[index] &&
        before.noteImportant?.[index] === after.noteImportant?.[index],
    );

  return sameValues && sameRecurring && sameExceptions && sameNoteIds;
}

function getInitialSlot(editingIndex: number | undefined, initialSlot: number | undefined) {
  return editingIndex === undefined ? initialSlot : undefined;
}

function bodyPointerEvents(copying: boolean) {
  return copying ? 'none' : 'auto';
}
