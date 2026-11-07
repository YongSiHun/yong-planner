import { DateInfo } from './DateInfo';
import { memo, useState, type ComponentRef } from 'react';
import { Keyboard, Pressable, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { Button, design, report, useTheme } from '../../../components/ui';
import { saveException, usePlanner } from '../../../stores/planner';
import { DayDate } from './DayDate';
import { ScheduleInput, SchedulePreview } from './ScheduleInput';
import type { PlanEntry, RecurringPlanException, TimeFormat } from '../types';
import { RecurringNote } from './RecurringNote';

interface DayRowProps {
  date: string;
  note: string;
  noteIds: string[];
  noteTimes: (string | null)[];
  timeFormat: TimeFormat;
  selectedIds: ReadonlySet<string>;
  selecting: boolean;
  copying: boolean;
  copyTarget: boolean;
  copySourceDate?: string;
  onCopyDate(date: string): void;
  editingIndex?: number;
  onSelect(date: string, index: number, begin?: boolean): void;
  recurring: PlanEntry[];
  exceptions: RecurringPlanException[];
  holidayName: string | null;
  isToday: boolean;
  isEditing: boolean;
  onEdit(date: string): void;
  onFinish(date: string): void;
  onMeasure(date: string, position: number, height: number): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}

export const DayRow = memo(function DayRow({
  date,
  note,
  noteIds,
  noteTimes = [],
  timeFormat = '24h',
  selectedIds,
  selecting,
  copying,
  copyTarget,
  copySourceDate,
  onCopyDate,
  editingIndex,
  onSelect,
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
    Keyboard.dismiss();
  }

  function handleBlur() {
    onFinish(date);
    void usePlanner.getState().flush().catch(report);
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
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: design.space.xs,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.line,
        backgroundColor: isToday ? theme.selected : 'transparent',
      }}
    >
      <DayDate
        date={date}
        holidayName={holidayName}
        onInfo={() => setInfoOpen(true)}
        isToday={isToday}
        copying={copying}
        copyTarget={copyTarget}
        copySource={copySourceDate === date}
        onCopyDate={onCopyDate}
        onFinish={onFinish}
      />
      <View
        pointerEvents={bodyPointerEvents(copying)}
        style={{ flex: 1, minWidth: 0, paddingVertical: 2 }}
      >
        {isEditing ? (
          <ScheduleInput
            date={date}
            note={note}
            noteTimes={noteTimes}
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
          <SchedulePreview
            date={date}
            note={note}
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
          <View
            key={exception.recurringPlanId}
            style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Text
              style={{
                fontFamily: design.font.regular,
                fontSize: design.type.caption,
                color: theme.muted,
              }}
            >
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
        id === after.noteIds[index] && before.noteTimes[index] === after.noteTimes[index],
    );

  return sameValues && sameRecurring && sameExceptions && sameNoteIds;
}

function getInitialSlot(editingIndex: number | undefined, initialSlot: number | undefined) {
  return editingIndex === undefined ? initialSlot : undefined;
}

function bodyPointerEvents(copying: boolean) {
  return copying ? 'none' : 'auto';
}
