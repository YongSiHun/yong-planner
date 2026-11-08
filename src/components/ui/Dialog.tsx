import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as styles from './Dialog.styles';
import { Label, useTheme } from './index';

export function Dialog({
  title,
  children,
  footer,
  onClose,
  showHeader = true,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
  showHeader?: boolean;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.dialogKeyboardAvoidingViewStyle}
        >
          <SafeAreaView style={styles.dialogSafeAreaViewStyle(theme)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="모달 닫기"
              onPress={onClose}
              style={styles.dialogPressableStyle}
            />
            <View accessibilityViewIsModal style={styles.dialogViewStyle(theme)}>
              <DialogHeading title={title} visible={showHeader} onClose={onClose} />
              <ScrollView
                style={styles.dialogScrollViewStyle}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.dialogScrollViewContentContainerStyle}
              >
                {children}
              </ScrollView>
              {footer ? <View style={styles.dialogViewStyle2}>{footer}</View> : null}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}

function DialogHeading({
  title,
  visible,
  onClose,
}: {
  title: string;
  visible: boolean;
  onClose(): void;
}) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.dialogHeadingViewStyle}>
      <Label style={styles.dialogHeadingLabelStyle}>{title}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        style={styles.dialogHeadingPressableStyle}
      >
        <Feather name="x" size={22} color={theme.muted} />
      </Pressable>
    </View>
  );
}
