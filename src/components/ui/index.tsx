import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { design } from './tokens';
import { fontForWeight } from './typography';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
export { design } from './tokens';

function getButtonOpacity(isDisabled: boolean, isPressed: boolean): number {
  if (isDisabled) {
    return 0.4;
  }
  if (isPressed) {
    return 0.6;
  }

  return 1;
}

export const light = {
  bg: '#F7FBFF',
  text: '#20344A',
  muted: '#566E87',
  line: '#DBE8F3',
  accent: '#1F6EAC',
  onAccent: '#FFFFFF',
  selected: '#E4F2FF',
  red: '#B5485B',
  blue: '#286DA5',
};
export const dark: typeof light = {
  bg: '#101E2D',
  text: '#E5F2FF',
  muted: '#9CB4CC',
  line: '#2A4259',
  accent: '#8BCBFA',
  onAccent: '#102435',
  selected: '#1C3B55',
  red: '#F4A1AF',
  blue: '#8BC4F0',
};
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
      style={[
        { color: muted ? theme.muted : theme.text, fontSize: 16, lineHeight: 25 },
        style,
        { fontFamily, fontWeight: 'normal' },
      ]}
    >
      {children}
    </Text>
  );
}

interface ButtonProps {
  title: string;
  onPress(): void;
  disabled?: boolean;
  selected?: boolean;
  danger?: boolean;
  textColor?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  compact?: boolean;
  bold?: boolean;
}
export function Button({
  title,
  onPress,
  disabled = false,
  selected = false,
  danger = false,
  textColor,
  accessibilityLabel,
  style,
  compact = false,
  bold = false,
}: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 44,
          minWidth: 44,
          paddingHorizontal: compact ? design.space.sm : design.space.md,
          paddingVertical: compact ? design.space.xs : 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: selected ? theme.selected : 'transparent',
          opacity: getButtonOpacity(disabled, pressed),
        },
        style,
      ]}
    >
      <Text
        style={{
          color: textColor ?? (danger ? theme.red : theme.accent),
          fontSize: compact ? design.type.small : 16,
          fontFamily: selected || bold ? design.font.bold : design.font.medium,
        }}
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
  const [contentHeight, setContentHeight] = useState(48);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <TextInput
      {...props}
      ref={input}
      onFocus={(event) => {
        onInputFocus?.(input.current);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
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
          setContentHeight(Math.max(48, event.nativeEvent.contentSize.height));
        }
        props.onContentSizeChange?.(event);
      }}
      style={[
        {
          color: theme.text,
          backgroundColor: theme.bg,
          borderColor: theme.line,
          borderWidth: 1,
          borderRadius: 9,
          padding: 12,
          minHeight: 48,
          height: props.multiline ? contentHeight : undefined,
          fontSize: 16,
          fontFamily: design.font.regular,
          textAlignVertical: 'top',
        },
        props.style,
      ]}
    />
  );
}

export function Sheet({
  children,
  onClose,
  title,
  scroll = false,
  showHeader = true,
}: {
  children: ReactNode;
  onClose(): void;
  title: string;
  scroll?: boolean;
  showHeader?: boolean;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}
        >
          <Pressable
            accessibilityLabel="바깥 영역을 눌러 닫기"
            accessibilityRole="button"
            onPress={onClose}
            style={{ flex: 1, minHeight: 24 }}
          />
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={{
              backgroundColor: theme.bg,
              maxHeight: '92%',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingHorizontal: 16,
              flexShrink: 1,
              width: '100%',
              maxWidth: 560,
              alignSelf: 'center',
            }}
            accessibilityViewIsModal
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.line,
                alignSelf: 'center',
                marginTop: 12,
              }}
            />
            {showHeader ? (
              <View style={styles.row}>
                <Label style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>{title}</Label>
                <Button title="닫기" onPress={onClose} />
              </View>
            ) : null}
            {scroll ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}

export function report(error: unknown): void {
  Alert.alert('확인해 주세요', error instanceof Error ? error.message : String(error));
}
export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  page: { flex: 1, paddingHorizontal: 20, width: '100%', maxWidth: 800, alignSelf: 'center' },
});
