import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { NOTE_SEPARATOR, noteInputValue, storedNoteIndex } from '../services/note';
import { formatScheduleContent, parseScheduleTimePrefix } from '../services/time';
import type { TimeFormat } from '../types';
import type { ScheduleInputProps, SchedulePreviewProps } from '../types/presentation';
import * as styles from './ScheduleInput.styles';

const PLACEHOLDER = '일정을 입력하세요. 쉼표(,)나 엔터로 나눌 수 있어요.';

export function ScheduleChip({
  content,
  important = false,
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
  important?: boolean;
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
  const parsed = parseScheduleTimePrefix(content.trim());
  const label = formatScheduleContent(parsed.content, parsed.time ?? time, timeFormat);

  if (!hasContent) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole={selecting ? 'checkbox' : 'button'}
      accessibilityLabel={chipAccessibilityLabel(label, important)}
      accessibilityState={{ selected, checked: selected }}
      accessibilityHint="길게 누르면 여러 일정을 선택할 수 있어요."
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.chip(selected, theme, important)}
    >
      {selected ? <Feather name="check" size={14} color={theme.onAccent} /> : null}
      <ImportantMark important={important} selected={selected} />
      <Text style={styles.chipLabel(selected, theme)}>{label}</Text>
      <ChipEdges
        selecting={selecting}
        content={content}
        onBefore={onBefore}
        onAfter={onAfter}
        onLongPress={onLongPress}
        onPress={onPress}
      />
    </Pressable>
  );
}

function ChipEdge({
  side,
  label,
  onPress,
  onLongPress,
}: {
  side: 'left' | 'right';
  label: string;
  onPress?: () => void;
  onLongPress(): void;
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
      onLongPress={onLongPress}
      hitSlop={2}
      style={styles.chipEdge(side)}
    />
  );
}

export function ScheduleInput({
  date,
  note,
  initialIndex,
  noteTimes = [],
  noteImportant = [],
  timeFormat = '24h',
  initialSlot,
  onSelect = () => {},
  onBlur,
  onEditPart,
  onInputFocus,
  onInputLayout,
}: ScheduleInputProps) {
  const theme = useTheme();
  const {
    edit,
    parts,
    content,
    input,
    availableWidth,
    requestedSelection,
    height,
    maximumHeight,
    inputWidth,
    handleChange,
    handleSelection,
    handleBlur,
    insertAt,
    handlePartPress,
    handleLongPress,
    handleTextLayout,
    handleFlowLayout,
  } = useScheduleInputState({
    date,
    note,
    initialIndex,
    noteTimes,
    timeFormat,
    initialSlot,
    onSelect,
    onBlur,
    onEditPart,
    onInputFocus,
    onInputLayout,
  });

  function renderChip(part: string, index: number) {
    return (
      <ScheduleChip
        key={index}
        content={part}
        important={
          noteImportant[storedNoteIndex(edit, index)] && !(edit.draftSlot && index === edit.index)
        }
        timeFormat={timeFormat}
        onLongPress={() => handleLongPress(index)}
        onBefore={() => insertAt(index)}
        onAfter={() => insertAt(index + 1)}
        onPress={() => handlePartPress(index)}
      />
    );
  }

  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      onLayout={handleFlowLayout}
      style={styles.field(theme)}
    >
      <Text
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        onTextLayout={handleTextLayout}
        style={styles.measurement(availableWidth)}
      >
        {content || ' '}
      </Text>
      {parts.slice(0, edit.index).map(renderChip)}
      {/* Native 입력 유지: 칩 전환 시 재마운트 방지. */}
      <TextInput
        ref={input}
        multiline
        autoFocus
        value={noteInputValue(edit)}
        onChange={handleChange}
        selection={requestedSelection}
        onSelectionChange={handleSelection}
        onFocus={() => onInputFocus(input.current)}
        onBlur={handleBlur}
        onLayout={onInputLayout}
        accessibilityLabel={date + ' 일정 입력'}
        accessibilityHint="쉼표나 엔터를 입력하면 일정이 나뉘어요."
        placeholder={edit.text.length === 0 ? PLACEHOLDER : undefined}
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        underlineColorAndroid="transparent"
        textAlignVertical="top"
        scrollEnabled={height > maximumHeight}
        onContentSizeChange={onInputLayout}
        style={styles.input(edit.text, theme, height, maximumHeight, inputWidth)}
      />
      {parts.slice(edit.index + 1).map((part, offset) => renderChip(part, edit.index + 1 + offset))}
    </Pressable>
  );
}

export function SchedulePreview({
  note,
  noteTimes = [],
  noteImportant = [],
  timeFormat = '24h',
  date,
  onEdit,
  onArm,
  onOutsidePress,
  onChipLayout,
  draggingIndex,
  overlay,
  onInsert,
  selecting = false,
  selectedIndexes = new Set<number>(),
  onSelect = () => {},
}: SchedulePreviewProps) {
  const hasContent = note.split(NOTE_SEPARATOR).some((part) => part.trim().length > 0);

  function handleBlankPress() {
    if (selecting) {
      onOutsidePress?.();

      return;
    }
    onEdit(hasContent ? undefined : 0);
  }

  if (!hasContent) {
    return (
      <Pressable
        onPress={handleBlankPress}
        accessibilityRole="button"
        accessibilityLabel={date + ', 일정 입력'}
        style={styles.emptyPreview}
      ></Pressable>
    );
  }

  return (
    <Pressable accessible={false} onPress={handleBlankPress} style={styles.preview}>
      {note.split(NOTE_SEPARATOR).map((part, index) => (
        <View
          key={index}
          onLayout={(event) => onChipLayout?.(index, event)}
          style={styles.chipWrapper(draggingIndex, index)}
        >
          <ScheduleChip
            content={part}
            important={noteImportant[index]}
            time={noteTimes[index]}
            timeFormat={timeFormat}
            selected={selectedIndexes.has(index)}
            selecting={selecting}
            onLongPress={() => {
              onArm?.(index);
              onSelect(index, true);
            }}
            onPress={() => (selecting ? onSelect(index) : onEdit(index))}
            onBefore={() => onInsert?.(index)}
            onAfter={() => onInsert?.(index + 1)}
          />
        </View>
      ))}
      {overlay}
    </Pressable>
  );
}

function ChipEdges({
  selecting,
  content,
  onBefore,
  onAfter,
  onLongPress,
  onPress,
}: {
  selecting: boolean;
  content: string;
  onBefore?: () => void;
  onAfter?: () => void;
  onLongPress(): void;
  onPress(): void;
}) {
  // 선택 전환 중 native 터치 대상 유지.
  return (
    <>
      <ChipEdge
        side="left"
        label={content.trim() + (selecting ? ' 선택' : ' 앞에 입력')}
        onPress={selecting ? onPress : onBefore}
        onLongPress={onLongPress}
      />
      <ChipEdge
        side="right"
        label={content.trim() + (selecting ? ' 선택' : ' 뒤에 입력')}
        onPress={selecting ? onPress : onAfter}
        onLongPress={onLongPress}
      />
    </>
  );
}

function chipAccessibilityLabel(label: string, important: boolean): string {
  return label + (important ? ', 중요 일정' : ', 일정');
}

function ImportantMark({ important, selected }: { important: boolean; selected: boolean }) {
  const theme = useTheme();

  if (!important) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.importantMark(selected, theme)}>
      <Feather name="star" size={10} color={selected ? theme.onAccent : theme.accent} />
    </View>
  );
}
