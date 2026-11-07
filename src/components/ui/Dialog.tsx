import type { ReactNode } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { design, Label, useTheme } from './index';

export function Dialog({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <SafeAreaView
            style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#00000066' }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="모달 닫기"
              onPress={onClose}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
            <View
              accessibilityViewIsModal
              style={{
                backgroundColor: theme.bg,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.line,
                padding: 16,
                maxHeight: '90%',
                width: '100%',
                maxWidth: 480,
                alignSelf: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Label style={{ flex: 1, fontSize: design.type.title, fontWeight: '700' }}>
                  {title}
                </Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                  onPress={onClose}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="x" size={22} color={theme.muted} />
                </Pressable>
              </View>
              <ScrollView
                style={{ flexShrink: 1 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 12 }}
              >
                {children}
              </ScrollView>
              {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}
