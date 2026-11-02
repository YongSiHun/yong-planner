import { createContext, useContext, useState, type ReactNode } from 'react';
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
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  bg: '#FAF9F6',
  text: '#242925',
  muted: '#737B73',
  line: '#E4E7DF',
  accent: '#3F6550',
  selected: '#E9F0E5',
  red: '#BB4951',
  blue: '#416EA6',
};
export const dark: typeof light = {
  bg: '#171D19',
  text: '#E8ECE6',
  muted: '#A1ADA2',
  line: '#354037',
  accent: '#A7C8AC',
  selected: '#293C2E',
  red: '#F28C94',
  blue: '#8DB8ED',
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
  style?: object;
}) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: muted ? theme.muted : theme.text, fontSize: 16, lineHeight: 25 }, style]}
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
          paddingHorizontal: 12,
          paddingVertical: 10,
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
          fontSize: 16,
          fontWeight: selected ? '700' : '500',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const theme = useTheme();
  const [contentHeight, setContentHeight] = useState(48);

  return (
    <TextInput
      {...props}
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
}: {
  children: ReactNode;
  onClose(): void;
  title: string;
  scroll?: boolean;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}
      >
        <Pressable
          accessibilityLabel="편집창 닫기"
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
          <View style={styles.row}>
            <Label style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>{title}</Label>
            <Button title="닫기" onPress={onClose} />
          </View>
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
    </Modal>
  );
}

export function report(error: unknown): void {
  Alert.alert('확인해 주세요', error instanceof Error ? error.message : String(error));
}
export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  page: { flex: 1, paddingHorizontal: 20 },
});
