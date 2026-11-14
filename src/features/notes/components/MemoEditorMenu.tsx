import Feather from '@expo/vector-icons/Feather';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label, useTheme } from '../../../components/ui';
import { HEADER_HEIGHT } from '../../../components/navigation/AppHeader.styles';
import { design } from '../../../components/ui/tokens';
import type { useMemoState } from '../hooks/useMemoState';
import * as styles from './MemoEditorMenu.styles';

export function MemoEditorMenu({ state }: { state: ReturnType<typeof useMemoState> }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const visible = state.editorMenuOpen && state.editing !== undefined;
  const right =
    Math.max(insets.right, (width - design.layout.contentMaxWidth) / 2) + design.space.sm;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={state.closeEditorMenu}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메모 메뉴 닫기"
          onPress={state.closeEditorMenu}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          style={styles.menu(theme, insets.top + HEADER_HEIGHT, right)}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="메모 삭제"
            disabled={state.disabled}
            accessibilityState={{ disabled: state.disabled }}
            onPress={state.requestEditorDelete}
            style={styles.item}
          >
            <Feather name="trash-2" size={design.icon.header} color={theme.red} />
            <Label style={styles.deleteText(theme)}>삭제</Label>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
