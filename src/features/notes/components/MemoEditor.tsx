import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as headerStyles from '../../../components/navigation/AppHeader.styles';
import { Label, useTheme } from '../../../components/ui';
import { MEMO_MAX_LENGTH } from '../services/validation';
import type { MemoEditorModel } from '../types/presentation';
import * as styles from './MemoEditor.styles';

export function MemoEditor({ state }: { state: MemoEditorModel }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + headerStyles.HEADER_HEIGHT + 1}
    >
      <TextInput
        multiline
        accessibilityLabel="메모 본문"
        placeholder="메모를 적어보세요."
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        value={state.content}
        editable={!state.disabled && !state.editing?.deletedAt}
        maxLength={Math.max(0, MEMO_MAX_LENGTH - state.title.length)}
        onChangeText={state.setContent}
        textAlignVertical="top"
        style={styles.editor(theme)}
      />
      <MemoValidation state={state} />
    </KeyboardAvoidingView>
  );
}

function MemoValidation({ state }: { state: MemoEditorModel }) {
  const theme = useTheme();
  const message = state.lengthError ?? state.limitNotice;

  if (!message) {
    return null;
  }

  return <Label style={styles.validation(theme, Boolean(state.lengthError))}>{message}</Label>;
}
