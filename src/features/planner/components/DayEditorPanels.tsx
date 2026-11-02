import { Button, Input, Label, Sheet } from '../../../components/ui';
import { dayLabel } from '../../../utils/date';
import { Calendar } from './Calendar';
import type { useDayEditor } from '../hooks/useDayEditor';

type EditorController = Pick<
  ReturnType<typeof useDayEditor>,
  | 'actions'
  | 'exception'
  | 'isCalendarOpen'
  | 'closeActions'
  | 'closeCalendar'
  | 'closeException'
  | 'handleCancelOccurrence'
  | 'handleExceptionEdit'
  | 'handleExceptionReset'
  | 'handleRecurringEdit'
  | 'handleDateChange'
  | 'handleExceptionChange'
  | 'handleExceptionSave'
>;

export function DayEditorPanels({ date, editor }: { date: string; editor: EditorController }) {
  const hasActions = editor.actions !== null;

  if (hasActions) {
    return (
      <Sheet title="반복 일정" onClose={editor.closeActions} scroll>
        <Label>{editor.actions!.entry.content}</Label>
        <Button title="이 날짜만 취소" onPress={editor.handleCancelOccurrence} />
        <Button title="이 날짜만 수정" onPress={editor.handleExceptionEdit} />
        <Button title="이 날짜 예외 초기화" onPress={editor.handleExceptionReset} />
        <Button title="반복 일정 전체 수정" onPress={editor.handleRecurringEdit} />
      </Sheet>
    );
  }

  const isCalendarOpen = editor.isCalendarOpen;

  if (isCalendarOpen) {
    return (
      <Sheet title="날짜 선택" onClose={editor.closeCalendar}>
        <Calendar selected={date} onSelect={editor.handleDateChange} />
      </Sheet>
    );
  }

  const exception = editor.exception;
  const hasException = exception !== null;

  if (!hasException) {
    return null;
  }

  return (
    <Sheet title="이 날짜만 수정" onClose={editor.closeException} scroll>
      <Label>{dayLabel(date)}</Label>
      <Input
        accessibilityLabel="이 날짜 제목"
        value={exception.title}
        multiline
        onChangeText={(title) => editor.handleExceptionChange({ title })}
      />
      <Input
        accessibilityLabel="이 날짜 시간, 비우면 시간 없음"
        placeholder="HH:mm · 비우면 시간 없음"
        value={exception.time}
        onChangeText={(time) => editor.handleExceptionChange({ time })}
      />
      <Button title="저장" selected onPress={editor.handleExceptionSave} />
    </Sheet>
  );
}
