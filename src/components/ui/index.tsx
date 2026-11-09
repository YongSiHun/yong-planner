import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { showDialog } from '../../controllers/dialog';
import * as styles from './index.styles';
import { InputFocusContext } from './InputFocusContext';
import { light } from './palette';
import { design } from './tokens';
import { fontForWeight } from './typography';
export { showToast } from '../../controllers/toast';
export { showDialog } from '../../controllers/dialog';
export { design } from './tokens';

export { layout as styles } from './layout.styles';
export { dark, light, palette } from './palette';
export const ThemeContext = createContext(light);
export function useTheme() {
  return useContext(ThemeContext);
}

export function Label({
  children,
  muted = false,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const flattened = StyleSheet.flatten(style);
  const fontFamily = flattened?.fontFamily ?? fontForWeight(flattened?.fontWeight);

  return (
    <Text
      style={styles.label(fontFamily, flattened?.fontSize ?? design.type.body, muted, theme, style)}
    >
      {children}
    </Text>
  );
}

interface ButtonProps {
  title: string;
  onPress(): void;
  disabled?: boolean;
  onDisabledPress?(): void;
  selected?: boolean;
  danger?: boolean;
  textColor?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  compact?: boolean;
  bold?: boolean;
  labelSize?: number;
}
export function Button({
  title,
  onPress,
  disabled = false,
  onDisabledPress,
  selected = false,
  danger = false,
  textColor,
  accessibilityLabel,
  style,
  compact = false,
  bold = false,
  labelSize,
}: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, selected }}
      disabled={disabled && !onDisabledPress}
      onPress={disabled ? onDisabledPress : onPress}
      style={styles.button(
        compact,
        selected,
        theme,

        disabled,
        style,
      )}
    >
      <Text
        style={styles.buttonLabel(textColor, danger, theme, labelSize, compact, selected, bold)}
      >
        {title}
      </Text>
    </Pressable>
  );
}

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

export function report(error: unknown): void {
  showDialog('확인해 주세요', error instanceof Error ? error.message : String(error));
}
