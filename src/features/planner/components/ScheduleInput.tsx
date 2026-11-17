import { Pressable, TextInput } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { useInputHeight } from '../hooks/useInputHeight';
import { storedNoteIndex } from '../services/note';
import type { ScheduleInputProps } from '../types/presentation';
import * as styles from './ScheduleInput.styles';
import { ScheduleChip } from './ScheduleChip';

const PLACEHOLDER = '일정 입력';

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
  const { height, handleContentSize } = useInputHeight();
  const {
    edit,
    nativeValue,
    initialValue,
    parts,
    input,
    requestedSelection,
    handleChange,
    handleSelection,
    handleBlur,
    insertAt,
    handlePartPress,
    handleLongPress,
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

  const editor = (
    <TextInput
      key="active-input"
      ref={input}
      multiline
      submitBehavior="newline"
      autoFocus
      autoCorrect={false}
      spellCheck={false}
      autoCapitalize="none"
      smartInsertDelete={false}
      defaultValue={initialValue}
      value={nativeValue}
      onChange={handleChange}
      selection={requestedSelection}
      onSelectionChange={handleSelection}
      onFocus={() => onInputFocus(input.current)}
      onBlur={handleBlur}
      onLayout={onInputLayout}
      accessibilityLabel={date + ' 일정 입력'}
      accessibilityHint="쉼표로 새 칩을 만들고 엔터로 줄바꿈해요."
      placeholder={PLACEHOLDER}
      placeholderTextColor={theme.muted}
      selectionColor={theme.accent}
      cursorColor={theme.accent}
      underlineColorAndroid="transparent"
      textAlignVertical="top"
      scrollEnabled={false}
      onContentSizeChange={handleContentSize}
      style={styles.input(theme, height)}
    />
  );

  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.field}>
      {/* Native 입력 유지: 칩 전환 시 재마운트 방지. */}
      {[
        ...parts.slice(0, edit.index).map(renderChip),
        editor,
        ...parts
          .slice(edit.index + 1)
          .map((part, offset) => renderChip(part, edit.index + 1 + offset)),
      ]}
    </Pressable>
  );
}
