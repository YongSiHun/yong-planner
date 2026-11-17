import { Pressable, TextInput } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { useInputHeight } from '../hooks/useInputHeight';
import type { ScheduleInputProps } from '../types/presentation';
import * as styles from './ScheduleInput.styles';

export function ScheduleInput(props: ScheduleInputProps) {
  const theme = useTheme();
  const { height, handleContentSize } = useInputHeight();
  const { input, nativeValue, initialValue, handleChange, handleBlur } =
    useScheduleInputState(props);

  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.field}>
      <TextInput
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
        onFocus={() => props.onInputFocus(input.current)}
        onBlur={handleBlur}
        onLayout={props.onInputLayout}
        accessibilityLabel={props.date + ' 일정 입력'}
        accessibilityHint="쉼표로 일정을 구분하고 엔터로 줄바꿈해요. 입력을 마치면 칩으로 표시해요."
        placeholder="일정 입력"
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        underlineColorAndroid="transparent"
        textAlignVertical="top"
        scrollEnabled={false}
        onContentSizeChange={handleContentSize}
        style={styles.input(theme, height)}
      />
    </Pressable>
  );
}
