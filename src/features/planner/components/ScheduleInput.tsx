import { formatScheduleContent } from '../services/time';
import type { TimeFormat } from '../types';
import Feather from '@expo/vector-icons/Feather';
import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  type TextInputSelectionChangeEvent,
  type TextInputChangeEvent,
} from 'react-native';
import { design, useTheme } from '../../../components/ui';
import { saveDailyNote } from '../../../stores/planner';
import {
  insertNoteSlot,
  storedNoteIndex,
  selectNotePart,
  notePartTime,
  startNoteEdit,
  noteInputValue,
  noteInputCaret,
  NOTE_SEPARATOR,
  type NoteEdit,
} from '../services/note';

import { NoteInputEvents } from '../services/noteInputEvents';

const PLACEHOLDER = '일정을 입력하세요. 쉼표(,)로 나눌 수 있어요.';

interface ScheduleInputProps {
  date: string;
  note: string;
  initialIndex?: number;
  noteTimes?: readonly (string | null)[];
  timeFormat?: TimeFormat;
  initialSlot?: number;
  onSelect?(index: number, begin?: boolean): void;
  onBlur(): void;
  onEditPart(index: number): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}

export function ScheduleChip({
  content,
  time,
  timeFormat = '24h',
  onPress,
  onLongPress,
  onBefore,
  onAfter,
  selected = false,
  selecting = false,
}: {
  content: string;
  time?: string | null;
  timeFormat?: TimeFormat;
  onPress(): void;
  onLongPress(): void;
  onBefore?(): void;
  onAfter?(): void;
  selected?: boolean;
  selecting?: boolean;
}) {
  const theme = useTheme();
  const hasContent = content.trim().length > 0;
  const label = formatScheduleContent(content.trim(), time, timeFormat);

  if (!hasContent) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole={selecting ? 'checkbox' : 'button'}
      accessibilityLabel={label + ', 일정'}
      accessibilityState={{ selected, checked: selected }}
      accessibilityHint="길게 누르면 여러 일정을 선택할 수 있어요."
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? theme.accent : theme.bg,
        borderColor: selected ? theme.accent : theme.line,
        borderWidth: 1,
        borderRadius: design.radius.pill,
        paddingHorizontal: design.space.sm,
        paddingVertical: 3,
        minHeight: 30,
        maxWidth: '100%',
        opacity: pressed ? 0.75 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      })}
    >
      {selected ? <Feather name="check" size={14} color={theme.onAccent} /> : null}
      <Text
        style={{
          color: selected ? theme.onAccent : theme.text,
          fontFamily: design.font.regular,
          includeFontPadding: false,
          fontSize: design.type.body,
          lineHeight: design.lineHeight,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
      <ChipEdges selecting={selecting} content={content} onBefore={onBefore} onAfter={onAfter} />
    </Pressable>
  );
}

function ChipEdge({
  side,
  label,
  onPress,
}: {
  side: 'left' | 'right';
  label: string;
  onPress?: () => void;
}) {
  const canPress = onPress !== undefined;

  if (!canPress) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={2}
      style={{ position: 'absolute', [side]: 0, top: 0, bottom: 0, width: 8 }}
    />
  );
}

export function ScheduleInput({
  date,
  note,
  initialIndex,
  noteTimes = [],
  timeFormat = '24h',
  initialSlot,
  onSelect = () => {},
  onBlur,
  onEditPart,
  onInputFocus,
  onInputLayout,
}: ScheduleInputProps) {
  const theme = useTheme();
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
  const maximumHeight = Math.max(80, Math.min(240, windowHeight * 0.32));
  const [edit, setEdit] = useState<NoteEdit>(() =>
    initialSlot === undefined
      ? startNoteEdit(note, initialIndex)
      : insertNoteSlot({ text: note, index: 0 }, initialSlot),
  );
  const [height, setHeight] = useState<number>(design.rowMinHeight);
  const [availableWidth, setAvailableWidth] = useState(Math.max(30, windowWidth - 68));
  const [textWidth, setTextWidth] = useState({ text: '', width: 0 });
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const currentEdit = useRef(edit);
  const inputEvents = useRef(new NoteInputEvents());
  const selectionRequest = useRef<{ edit: NoteEdit; applied: boolean } | null>(null);
  const parts = edit.text.split(NOTE_SEPARATOR);
  const content = parts[edit.index]!;
  const estimatedWidth = estimateInputWidth(content, fontScale ?? 1);
  const measuredWidth = Math.max(estimatedWidth, textWidth.width);
  const inputWidth =
    edit.text.length === 0
      ? availableWidth
      : Math.min(availableWidth, Math.max(30, measuredWidth + 18));
  const caret = noteInputCaret(edit);
  const requestedSelection = caret === undefined ? undefined : { start: caret, end: caret };

  useLayoutEffect(() => {
    const hasCaret = caret !== undefined;

    if (!hasCaret) {
      return;
    }
    const request = { edit, applied: false };

    selectionRequest.current = request;
    const frame = requestAnimationFrame(() => {
      const isCurrent = currentEdit.current === request.edit;

      if (!isCurrent) {
        return;
      }
      input.current?.focus();
      input.current?.setSelection(caret, caret);
      request.applied = true;
      onInputLayout();
    });

    return () => cancelAnimationFrame(frame);
  }, [caret, edit, onInputLayout]);

  function applyEdit(next: NoteEdit, persist = true) {
    const changedIndex = next.index !== currentEdit.current.index;

    if (changedIndex) {
      setHeight(design.rowMinHeight);
      const nextContent = next.text.split(NOTE_SEPARATOR)[next.index] ?? '';

      setTextWidth({ text: nextContent, width: estimateInputWidth(nextContent, fontScale ?? 1) });
    }
    currentEdit.current = next;
    setEdit(next);
    if (persist) {
      saveDailyNote(date, next.text);
    }
  }

  function handleChange(event: TextInputChangeEvent) {
    const { text, eventCount } = event.nativeEvent;
    const next = inputEvents.current.change(currentEdit.current, text, eventCount);
    const hasChange = next !== null;

    if (hasChange) {
      applyEdit(next);
    }
  }

  function handleSelection(event: TextInputSelectionChangeEvent) {
    const current = currentEdit.current;
    const expected = noteInputCaret(current);
    const selection = event.nativeEvent.selection;
    const reachedCaret = expected === selection.start && expected === selection.end;
    const request = selectionRequest.current;
    const isCurrentRequest = request?.edit === current;
    const hasAppliedRequest = request?.applied === true && isCurrentRequest;
    const canReleaseCaret = hasAppliedRequest && reachedCaret;

    if (canReleaseCaret) {
      inputEvents.current.acknowledge();
      const next = { ...current, caret: undefined };

      currentEdit.current = next;
      setEdit(next);
    }
    onInputLayout();
  }

  function handleBlur() {
    onInputFocus(null);
    onBlur();
  }

  function selectEdit(next: NoteEdit) {
    const nextContent = next.text.split(NOTE_SEPARATOR)[next.index] ?? '';

    setHeight(design.rowMinHeight);
    setTextWidth({ text: nextContent, width: estimateInputWidth(nextContent, fontScale ?? 1) });
    inputEvents.current.select(noteInputValue(currentEdit.current), noteInputValue(next));
    applyEdit(next, false);
  }

  function insertAt(boundary: number) {
    selectEdit(insertNoteSlot(currentEdit.current, boundary));
  }

  function renderChip(part: string, index: number) {
    return (
      <ScheduleChip
        key={index}
        content={part}
        time={notePartTime(noteTimes, edit, index)}
        timeFormat={timeFormat}
        onLongPress={() => onSelect(storedNoteIndex(currentEdit.current, index), true)}
        onBefore={() => insertAt(index)}
        onAfter={() => insertAt(index + 1)}
        onPress={() => {
          const next = selectNotePart(currentEdit.current, index);

          selectEdit(next);
          onEditPart(next.index);
        }}
      />
    );
  }

  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      onLayout={(event) => setAvailableWidth(Math.max(30, event.nativeEvent.layout.width - 10))}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 4,
        padding: 4,
        marginVertical: 3,
        minHeight: design.touchTarget,
        borderWidth: 1,
        borderColor: theme.accent,
        borderRadius: design.radius.small,
        backgroundColor: theme.selected,
      }}
    >
      <Text
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        onTextLayout={(event) => {
          const current = currentEdit.current;
          const currentContent = current.text.split(NOTE_SEPARATOR)[current.index] ?? '';
          const isCurrent = currentContent === content;

          if (!isCurrent) {
            return;
          }
          const width = event.nativeEvent.lines.reduce(
            (maximum, line) => Math.max(maximum, line.width),
            0,
          );

          setTextWidth((previous) => {
            const unchanged = previous.text === content && previous.width === width;

            return unchanged ? previous : { text: content, width };
          });
        }}
        style={{
          position: 'absolute',
          opacity: 0,
          maxWidth: Math.max(1, availableWidth - 18),
          fontFamily: design.font.regular,
          fontSize: design.type.body,
          lineHeight: design.lineHeight,
        }}
      >
        {content || ' '}
      </Text>
      {parts.slice(0, edit.index).map(renderChip)}
      {/* Keep one native input mounted while chips and the active part change. */}
      <TextInput
        ref={input}
        multiline
        value={noteInputValue(edit)}
        onChange={handleChange}
        selection={requestedSelection}
        onSelectionChange={handleSelection}
        onFocus={() => onInputFocus(input.current)}
        onBlur={handleBlur}
        onLayout={onInputLayout}
        accessibilityLabel={date + ' 일정 입력'}
        accessibilityHint="쉼표를 입력하면 일정이 나뉘어요."
        placeholder={edit.text.length === 0 ? PLACEHOLDER : undefined}
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        underlineColorAndroid="transparent"
        textAlignVertical="top"
        scrollEnabled={height > maximumHeight}
        onContentSizeChange={(event) => {
          setHeight(Math.max(design.rowMinHeight, event.nativeEvent.contentSize.height));
          onInputLayout();
        }}
        style={{
          fontFamily: design.font.regular,
          fontSize: design.type.body,
          lineHeight: design.lineHeight,
          color: theme.text,
          paddingHorizontal: 8,
          paddingVertical: 4,
          height: Math.min(height, maximumHeight),
          minHeight: design.rowMinHeight,
          width: inputWidth,
          minWidth: 30,
          maxWidth: '100%',
          flexGrow: 0,
          flexShrink: 1,
        }}
      />
      {parts.slice(edit.index + 1).map((part, offset) => renderChip(part, edit.index + 1 + offset))}
    </Pressable>
  );
}

export function SchedulePreview({
  note,
  noteTimes = [],
  timeFormat = '24h',
  date,
  onEdit,
  onInsert,
  selecting = false,
  selectedIndexes = new Set<number>(),
  onSelect = () => {},
}: {
  note: string;
  noteTimes?: readonly (string | null)[];
  timeFormat?: TimeFormat;
  date: string;
  onEdit(index?: number): void;
  onInsert?(boundary: number): void;
  selecting?: boolean;
  selectedIndexes?: ReadonlySet<number>;
  onSelect?(index: number, begin?: boolean): void;
}) {
  const hasContent = note.split(NOTE_SEPARATOR).some((part) => part.trim().length > 0);

  if (!hasContent) {
    return (
      <Pressable
        disabled={selecting}
        accessibilityState={{ disabled: selecting }}
        onPress={() => onEdit(0)}
        accessibilityRole="button"
        accessibilityLabel={date + ', 일정 입력'}
        style={{ minHeight: design.rowMinHeight, justifyContent: 'center', paddingVertical: 7 }}
      ></Pressable>
    );
  }

  return (
    <Pressable
      accessible={false}
      onPress={() => {
        const canEdit = !selecting;

        if (canEdit) {
          onEdit();
        }
      }}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingVertical: 4,
        minHeight: design.rowMinHeight,
      }}
    >
      {note.split(NOTE_SEPARATOR).map((part, index) => (
        <ScheduleChip
          key={index}
          content={part}
          time={noteTimes[index]}
          timeFormat={timeFormat}
          selected={selectedIndexes.has(index)}
          selecting={selecting}
          onLongPress={() => onSelect(index, true)}
          onPress={() => (selecting ? onSelect(index) : onEdit(index))}
          onBefore={() => onInsert?.(index)}
          onAfter={() => onInsert?.(index + 1)}
        />
      ))}
    </Pressable>
  );
}

function ChipEdges({
  selecting,
  content,
  onBefore,
  onAfter,
}: {
  selecting: boolean;
  content: string;
  onBefore?: () => void;
  onAfter?: () => void;
}) {
  if (selecting) {
    return null;
  }

  return (
    <>
      <ChipEdge side="left" label={content.trim() + ' 앞에 입력'} onPress={onBefore} />
      <ChipEdge side="right" label={content.trim() + ' 뒤에 입력'} onPress={onAfter} />
    </>
  );
}

function estimateInputWidth(text: string, scale: number): number {
  const units = text
    .split('\n')
    .reduce((maximum, line) => Math.max(maximum, line.replace(/[^\x00-\x7F]/g, 'xx').length), 0);

  return units * design.type.body * scale * 0.5;
}
