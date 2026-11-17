import { useContext, useRef, useState, type ComponentRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { InputFocusContext } from './InputFocusContext';
import * as styles from './Input.styles';
import { useTheme } from './theme';
import { design } from './tokens';

export function Input({
  onInputFocus,
  ...props
}: TextInputProps & {
  onInputFocus?(input: ComponentRef<typeof TextInput> | null): void;
}) {
  const theme = useTheme();
  const [contentHeight, setContentHeight] = useState<number>(design.controlHeight);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const reportFocus = useContext(InputFocusContext);

  return (
    <TextInput
      {...props}
      ref={input}
      onFocus={(event) => {
        reportFocus?.(input.current);
        onInputFocus?.(input.current);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        reportFocus?.(null);
        onInputFocus?.(null);
        props.onBlur?.(event);
      }}
      selectionColor={theme.accent}
      cursorColor={theme.accent}
      placeholderTextColor={theme.muted}
      scrollEnabled={props.multiline ? false : props.scrollEnabled}
      onContentSizeChange={(event) => {
        const isMultiline = Boolean(props.multiline);

        if (isMultiline) {
          setContentHeight(Math.max(design.controlHeight, event.nativeEvent.contentSize.height));
        }
        props.onContentSizeChange?.(event);
      }}
      style={styles.input(theme, props.multiline, contentHeight, props.style)}
    />
  );
}
