import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as styles from './Dialog.styles';
import { ToastHost } from './ToastHost';
import { Label, useTheme } from './index';

export function Dialog({
  title,
  children,
  footer,
  onClose,
  showHeader = true,
  dismissOnPress = false,
  height,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
  showHeader?: boolean;
  dismissOnPress?: boolean;
  height?: number;
}) {
  const theme = useTheme();
  const Surface = dismissOnPress ? Pressable : View;

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
            <Surface
              accessibilityViewIsModal
              accessible={false}
              onPress={dismissOnPress ? onClose : undefined}
              style={styles.dialogViewStyle(theme, height)}
            >
              <DialogHeading
                title={title}
                visible={showHeader}
                showClose={!dismissOnPress}
                onClose={onClose}
              />
              <ScrollView
                style={styles.dialogScrollViewStyle}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.dialogScrollViewContentContainerStyle}
              >
                {children}
              </ScrollView>
              {footer ? <View style={styles.dialogViewStyle2}>{footer}</View> : null}
            </Surface>
            <ToastHost />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}

function DialogHeading({
  title,
  visible,
  showClose,
  onClose,
}: {
  title: string;
  visible: boolean;
  showClose: boolean;
  onClose(): void;
}) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.dialogHeadingViewStyle}>
      <Label style={styles.dialogHeadingLabelStyle}>{title}</Label>
      {showClose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onClose}
          style={styles.dialogHeadingPressableStyle}
        >
          <Feather name="x" size={22} color={theme.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
