import { TextInput } from 'react-native';
import type { ScheduleTextFieldProps } from '../types/presentation';
import { useTheme } from '../../../components/ui';
import { useInputHeight } from '../hooks/useInputHeight';
import * as styles from './ScheduleTextField.styles';

// Native content measurement rerenders this field, never the surrounding chips.
export function ScheduleTextField({
  date,
  inputRef,
  initialValue,
  nativeValue,
  onChange,
  onBlur,
  onFocus,
  onLayout,
}: ScheduleTextFieldProps) {
  const theme = useTheme();
  const { height, handleContentSize } = useInputHeight();

  return (
    <TextInput
      ref={inputRef}
      multiline
      submitBehavior="newline"
      autoFocus
      autoCorrect={false}
      spellCheck={false}
      autoCapitalize="none"
      smartInsertDelete={false}
      defaultValue={initialValue}
      value={nativeValue}
      onPressIn={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      onChange={onChange}
      onFocus={() => onFocus(inputRef.current)}
      onBlur={onBlur}
      onLayout={onLayout}
      accessibilityLabel={date + ' 일정 입력'}
      accessibilityHint="쉼표를 입력하거나 다른 곳을 누르면 칩으로 완성해요."
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
  );
}
