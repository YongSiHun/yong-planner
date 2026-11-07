import { useMemo } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, Sheet, styles, useTheme } from '../../../components/ui';
import {
  usePlanner,
  editDaily,
  deleteDaily,
  saveOrder,
  saveException,
} from '../../../stores/planner';
import { dayLabel, shiftDate } from '../../../utils/date';
import { plansForDate } from '../services/plans';
import { getSaveStatus } from '../services/presentation';
import { useDayEditor } from '../hooks/useDayEditor';
import { useHolidays } from '../hooks/useHolidays';
import { DragList } from './DragList';
import { DayEditorPanels } from './DayEditorPanels';
import type { PlanEntry, PlannerData } from '../types';

interface DayEditorProps {
  date: string;
  onDate(date: string): void;
  onClose(): void;
}

function EditorEntry({
  entry,
  focusId,
  onRecurringPress,
}: {
  entry: PlanEntry;
  focusId: string | null;
  onRecurringPress(entry: PlanEntry): void;
}) {
  const isRecurring = entry.kind === 'recurring';

  if (isRecurring) {
    return (
      <Button
        title={'↻ ' + entry.content}
        onPress={() => onRecurringPress(entry)}
        style={{ alignItems: 'flex-start' }}
      />
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Input
        accessibilityLabel="일반 일정 내용"
        multiline
        autoFocus={focusId === entry.sourceId}
        value={entry.content}
        onChangeText={(content) => editDaily(entry.sourceId, content)}
        placeholder="하고 싶은 일을 적어 보세요"
        style={{ flex: 1, borderWidth: 0, paddingHorizontal: 4 }}
      />
      <Button title="삭제" danger onPress={() => deleteDaily(entry.sourceId)} />
    </View>
  );
}

function SaveError({ onRetry }: { onRetry(): void }) {
  const error = usePlanner((state) => state.error);
  const theme = useTheme();
  const hasError = error !== null;

  if (!hasError) {
    return null;
  }

  return (
    <View>
      <Label style={{ color: theme.red }}>{error}</Label>
      <Button title="다시 저장" onPress={onRetry} />
    </View>
  );
}

function EditorFooter({ date, data, onAdd }: { date: string; data: PlannerData; onAdd(): void }) {
  const exceptions = data.recurringPlanExceptions.filter((item) => item.date === date);

  return (
    <View>
      <Button title="+ 일정 추가" onPress={onAdd} />
      {exceptions.map((exception) => (
        <View key={exception.recurringPlanId} style={styles.row}>
          <Label muted style={{ flex: 1 }}>
            {data.recurringPlans.find((plan) => plan.id === exception.recurringPlanId)?.title}
            {' · '}
            {exception.cancelled ? '이 날짜 취소' : '이 날짜 수정'}
          </Label>
          <Button
            title="예외 초기화"
            onPress={() => saveException(exception.recurringPlanId, date, null)}
          />
        </View>
      ))}
    </View>
  );
}

export function DayEditor(props: DayEditorProps) {
  const { date } = props;
  const editor = useDayEditor(props);
  const holidays = useHolidays();
  const isSaving = usePlanner((state) => state.saving);
  const isDirty = usePlanner((state) => state.dirty);
  const entries = useMemo(
    () => plansForDate(editor.data, date, holidays),
    [editor.data, date, holidays],
  );

  function handleOrderChange(items: PlanEntry[]) {
    saveOrder(
      date,
      items.map((entry) => entry.id),
    );
  }

  return (
    <Sheet title="하루 계획" onClose={editor.handleClose}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Button title="‹ 전날" onPress={() => editor.handleDateChange(shiftDate(date, -1))} />
        <Button title={dayLabel(date) + ' ▾'} onPress={editor.handleCalendarOpen} />
        <Button title="다음 날 ›" onPress={() => editor.handleDateChange(shiftDate(date, 1))} />
      </View>

      <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 8 }]}>
        <Label muted>{getSaveStatus(isSaving, isDirty)}</Label>
        <Button title="기본 순서로" onPress={() => saveOrder(date, null)} />
      </View>

      <SaveError onRetry={editor.handleRetrySave} />

      <DragList
        key={date}
        items={entries}
        id={(entry) => entry.id}
        onOrder={handleOrderChange}
        render={(entry) => (
          <EditorEntry
            entry={entry}
            focusId={editor.focusId}
            onRecurringPress={editor.handleRecurringPress}
          />
        )}
        footer={<EditorFooter date={date} data={editor.data} onAdd={editor.handleAddItem} />}
      />

      <Button title="완료" selected onPress={editor.handleClose} style={{ marginVertical: 8 }} />
      <DayEditorPanels date={date} editor={editor} />
    </Sheet>
  );
}
