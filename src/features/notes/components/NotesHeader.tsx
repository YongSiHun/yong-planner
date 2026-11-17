import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { HeaderBar } from '../../../components/navigation/HeaderBar';
import * as headerStyles from '../../../components/navigation/AppHeader.styles';
import { design, Label, useTheme } from '../../../components/ui';
import { MEMO_TITLE_MAX_LENGTH } from '../services/validation';
import type { MemoState } from '../types/presentation';
import * as styles from './NotesHeader.styles';

export function NotesHeader({ state }: { state: MemoState }) {
  return (
    <HeaderBar>
      <NotesBack state={state} />
      <View style={headerStyles.heading}>
        <NotesHeading state={state} />
      </View>
      <View style={headerStyles.actions}>
        <HeaderActions state={state} />
      </View>
    </HeaderBar>
  );
}

function NotesBack({ state }: { state: MemoState }) {
  const editorOpen = state.editing !== undefined;
  const selecting = state.selecting;

  const trashed = state.editing?.deletedAt !== undefined;

  if (trashed) {
    return <HeaderAction label="메모 닫기" icon="chevron-left" onPress={state.closeEditor} />;
  }
  if (editorOpen) {
    return <EditorSave state={state} />;
  }
  if (selecting) {
    return (
      <HeaderAction
        label="메모 선택 해제"
        icon="chevron-left"
        disabled={state.busy}
        onPress={state.cancelSelection}
      />
    );
  }

  return (
    <HeaderAction
      label="뒤로"
      icon="chevron-left"
      onPress={state.trashOpen ? state.closeTrash : () => router.back()}
    />
  );
}

function NotesHeading({ state }: { state: MemoState }) {
  const theme = useTheme();
  const editorOpen = state.editing !== undefined;

  if (editorOpen) {
    return <TitleInput state={state} />;
  }

  return (
    <Pressable
      disabled={!state.selecting || state.busy}
      onPress={state.cancelSelection}
      accessibilityRole="button"
      accessibilityLabel="메모"
      style={styles.headingTarget}
    >
      <Label style={styles.heading(theme)}>{state.trashOpen ? '휴지통' : '메모'}</Label>
    </Pressable>
  );
}

function TitleInput({ state }: { state: MemoState }) {
  const theme = useTheme();

  return (
    <TextInput
      accessibilityLabel="메모 제목"
      placeholder="제목"
      placeholderTextColor={theme.muted}
      value={state.title}
      onChangeText={state.setTitle}
      editable={!state.disabled && !state.editing?.deletedAt}
      autoFocus={state.editing === null}
      returnKeyType="next"
      maxLength={MEMO_TITLE_MAX_LENGTH}
      selectionColor={theme.accent}
      style={styles.titleInput(theme)}
    />
  );
}

function HeaderActions({ state }: { state: MemoState }) {
  const selecting = state.selecting;
  const editorOpen = state.editing !== undefined;

  const trashed = state.editing?.deletedAt !== undefined;

  if (trashed) {
    return (
      <HeaderAction
        trailing
        label="복구"
        icon="rotate-ccw"
        disabled={state.disabled}
        onPress={() => {
          void state.restore();
        }}
      />
    );
  }
  if (editorOpen) {
    return (
      <HeaderAction
        trailing
        label="메모 메뉴"
        icon="more-vertical"
        disabled={state.disabled}
        onPress={() => {
          Keyboard.dismiss();
          state.openEditorMenu();
        }}
      />
    );
  }
  if (selecting) {
    return (
      <HeaderAction
        trailing
        label="전체 해제"
        disabled={state.busy}
        onPress={state.cancelSelection}
      />
    );
  }

  const trashOpen = state.trashOpen;

  if (trashOpen) {
    return null;
  }

  return (
    <HeaderAction
      trailing
      label="메모 메뉴"
      icon="more-vertical"
      disabled={state.disabled}
      onPress={state.openListMenu}
    />
  );
}

function EditorSave({ state }: { state: MemoState }) {
  const empty = !(state.title.trim() || state.content.trim());

  return (
    <HeaderAction
      label="메모 저장"
      icon="check"
      disabled={state.disabled || empty || Boolean(state.validationError)}
      onPress={() => {
        void state.save();
      }}
    />
  );
}

function HeaderAction({
  label,
  icon,
  disabled,
  trailing = false,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  trailing?: boolean;
  onPress(): void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={styles.headerAction(disabled, !icon, trailing)}
    >
      {icon ? (
        <Feather name={icon} size={design.icon.header} color={theme.accent} />
      ) : (
        <Label style={styles.actionText(theme)}>{label}</Label>
      )}
    </Pressable>
  );
}
