import { memo, type ComponentRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, useTheme } from '../../../components/ui';
import { useRecurringNote } from '../hooks/useRecurringNote';
import type { PlanEntry } from '../types';
import * as styles from './RecurringNote.styles';
export const RecurringNote = memo(function RecurringNote({
  entry,
  date,
  onInputFocus,
  onInputLayout,
}: {
  entry: PlanEntry;
  date: string;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}) {
  const theme = useTheme();
  const {
    displayContent,
    titleInput,
    timeInput,
    editing,
    title,
    changeTitle,
    time,
    setTime,
    startEditing,
    save,
    close,
    cancel,
    openSeries,
  } = useRecurringNote(entry, date);

  if (!editing) {
    return (
      <Pressable
        onPress={startEditing}
        accessibilityRole="button"
        accessibilityLabel={displayContent + ', 이 날짜 반복 일정 수정'}
        style={styles.recurringNotePressableStyle}
      >
        <Text style={styles.recurringNoteTextStyle(theme)}>
          <Text style={styles.recurringNoteTextStyle2(theme)}>↻ </Text>
          {displayContent}
        </Text>
      </Pressable>
    );
  }

  const inputStyle = styles.recurringNoteInput(theme);

  return (
    <View style={styles.recurringNoteViewStyle}>
      <TextInput
        ref={titleInput}
        onFocus={() => onInputFocus(titleInput.current)}
        onBlur={() => onInputFocus(null)}
        onContentSizeChange={onInputLayout}
        onSelectionChange={onInputLayout}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        accessibilityLabel="이 날짜 반복 일정 제목"
        value={title}
        onChangeText={changeTitle}
        style={inputStyle}
        multiline
      />
      <TextInput
        ref={timeInput}
        onFocus={() => onInputFocus(timeInput.current)}
        onBlur={() => onInputFocus(null)}
        onSelectionChange={onInputLayout}
        accessibilityLabel="이 날짜 시간"
        value={time}
        onChangeText={setTime}
        placeholder="HH:mm · 비우면 시간 없음"
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        style={inputStyle}
      />
      <View style={styles.recurringNoteViewStyle2}>
        <Button compact title="저장" onPress={save} />
        <Button compact title="닫기" onPress={close} />
        <Button compact title="이 날짜 취소" danger onPress={cancel} />
        <Button compact title="전체 수정" onPress={openSeries} />
      </View>
    </View>
  );
});
