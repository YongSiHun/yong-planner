import Feather from '@expo/vector-icons/Feather';
import { useRef, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useInlineKeyboard } from '../../hooks/useInlineKeyboard';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { InputFocusContext } from './InputFocusContext';
import * as styles from './Dialog.styles';
import { ToastHost } from './ToastHost';
import { Label, useTheme } from './index';

export function Dialog({
  title,
  headerNotice,
  children,
  footer,
  onClose,
  showHeader = true,
  dismissOnPress = false,
  height,
  scrollable = true,
}: {
  title: string;
  headerNotice?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
  showHeader?: boolean;
  dismissOnPress?: boolean;
  height?: number;
  scrollable?: boolean;
}) {
  const theme = useTheme();
  const Surface = dismissOnPress ? Pressable : View;
  const keyboardVisible = useKeyboardVisible();

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <KeyboardAvoidingView behavior="padding" style={styles.dialogKeyboardAvoidingViewStyle}>
          <SafeAreaView
            edges={keyboardVisible ? ['top', 'left', 'right'] : undefined}
            style={styles.dialogSafeAreaViewStyle(theme, keyboardVisible)}
          >
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
                notice={headerNotice}
                visible={showHeader}
                showClose={!dismissOnPress}
                onClose={onClose}
              />
              <DialogBody scrollable={scrollable}>{children}</DialogBody>
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
  notice,
  visible,
  showClose,
  onClose,
}: {
  title: string;
  notice?: ReactNode;
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
      <View style={styles.dialogHeadingContent}>
        <Label style={styles.dialogHeadingLabelStyle}>{title}</Label>
        {notice}
      </View>
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

function DialogBody({ children, scrollable }: { children: ReactNode; scrollable: boolean }) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const keyboard = useInlineKeyboard(scrollRef);
  const body = scrollable ? (
    <ScrollView
      ref={scrollRef}
      style={styles.dialogScrollViewStyle}
      onLayout={keyboard.scheduleReveal}
      onContentSizeChange={keyboard.scheduleReveal}
      onScroll={keyboard.handleKeyboardScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
      contentContainerStyle={styles.dialogScrollViewContentContainerStyle}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixedBody}>{children}</View>
  );

  return (
    <InputFocusContext.Provider value={keyboard.handleInputFocus}>
      {body}
    </InputFocusContext.Provider>
  );
}
