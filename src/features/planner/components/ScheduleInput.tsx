import { Pressable, Text, TextInput } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { noteInputValue, storedNoteIndex } from '../services/note';
import type { ScheduleInputProps } from '../types/presentation';
import * as styles from './ScheduleInput.styles';
import { ScheduleChip } from './ScheduleChip';

const PLACEHOLDER = '일정을 입력하세요. 쉼표(,)나 엔터로 나눌 수 있어요.';

export function ScheduleInput({
  date,
  note,
  initialIndex,
  noteTimes = [],
  noteImportant = [],
  noteAlarms = [],
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
        alarm={
          noteAlarms[storedNoteIndex(edit, index)] && !(edit.draftSlot && index === edit.index)
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
        {edit.text.length === 0 ? PLACEHOLDER : content || ' '}
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
        style={styles.input(theme, height, maximumHeight, inputWidth)}
      />
      {parts.slice(edit.index + 1).map((part, offset) => renderChip(part, edit.index + 1 + offset))}
    </Pressable>
  );
}
export { ScheduleChip } from './ScheduleChip';
export { SchedulePreview } from './SchedulePreview';
