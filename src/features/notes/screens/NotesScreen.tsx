import Feather from '@expo/vector-icons/Feather';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import {
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_HEIGHT } from '../../../components/navigation/AppHeader.styles';
import { design, Label, useTheme } from '../../../components/ui';
import type { Memo } from '../../planner/types';
import { useMemoState } from '../hooks/useMemoState';
import { memoFields } from '../services/memo';
import { MemoEditorMenu } from '../components/MemoEditorMenu';
import { MEMO_TITLE_MAX_LENGTH, MEMO_MAX_LENGTH } from '../services/validation';
import * as styles from './NotesScreen.styles';

type MemoState = ReturnType<typeof useMemoState>;

export default function NotesScreen() {
  const theme = useTheme();
  const state = useMemoState();
  const editorOpen = state.editing !== undefined;

  useNotesBack(state);

  return (
    <SafeAreaView style={styles.screen(theme)} edges={['left', 'right', 'bottom']}>
      <NotesNavigation state={state} />
      <MemoEditorMenu state={state} />
      {state.error ? <Label style={styles.notice}>{state.error}</Label> : null}
      {editorOpen ? <MemoEditor state={state} /> : <MemoList state={state} />}
    </SafeAreaView>
  );
}

function useNotesBack({ editing, selecting, closeEditor, cancelSelection }: MemoState) {
  const editorOpen = editing !== undefined;
  const active = editorOpen || selecting;

  useEffect(() => {
    if (!active) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editorOpen) {
        closeEditor();
      } else {
        cancelSelection();
      }

      return true;
    });

    return () => subscription.remove();
  }, [active, editorOpen, closeEditor, cancelSelection]);
}

function NotesNavigation({ state }: { state: MemoState }) {
  const editorOpen = state.editing !== undefined;

  return (
    <Stack.Screen
      options={{
        title: '메모',
        gestureEnabled: !editorOpen && !state.selecting,
        headerLeft: notesHeaderLeft(state),
        headerTitle: () => <NotesHeading state={state} />,
        headerRight: () => <HeaderActions state={state} />,
      }}
    />
  );
}

function notesHeaderLeft(state: MemoState) {
  const selecting = state.selecting;
  const editorOpen = state.editing !== undefined;

  if (editorOpen) {
    return function SaveAction() {
      return <EditorSave state={state} />;
    };
  }
  if (selecting) {
    return function SelectionBack() {
      return (
        <HeaderAction
          label="메모 선택 해제"
          icon="chevron-left"
          disabled={state.busy}
          onPress={state.cancelSelection}
        />
      );
    };
  }

  return undefined;
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
      <Label style={styles.heading(theme)}>메모</Label>
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
      editable={!state.disabled}
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

  return (
    <HeaderAction
      trailing
      label="메모 추가"
      icon="plus"
      disabled={state.disabled}
      onPress={() => state.open(null)}
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
        void state.run(state.save);
      }}
    />
  );
}

function HeaderAction({
  label,
  icon,
  disabled,
  danger,
  trailing = false,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  danger?: boolean;
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
        <Feather name={icon} size={design.icon.header} color={danger ? theme.red : theme.accent} />
      ) : (
        <Label style={styles.actionText(theme)}>{label}</Label>
      )}
    </Pressable>
  );
}

function MemoList({ state }: { state: MemoState }) {
  return (
    <Pressable accessible={false} onPress={state.cancelSelection} style={styles.page}>
      <FlatList
        data={state.memos}
        keyExtractor={(memo) => memo.id}
        extraData={{
          selected: state.selected,
          selecting: state.selecting,
          disabled: state.disabled,
        }}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MemoRow memo={item} state={state} />}
        ListEmptyComponent={<EmptyMemos />}
        ListFooterComponent={
          <Pressable accessible={false} onPress={state.cancelSelection} style={styles.blankSpace} />
        }
        ListFooterComponentStyle={styles.listFooter}
      />
      <MemoSelectionActions state={state} />
    </Pressable>
  );
}

function MemoSelectionActions({ state }: { state: MemoState }) {
  const theme = useTheme();
  const selecting = state.selecting;
  const disabled = state.disabled || state.selected.size === 0;

  if (!selecting) {
    return null;
  }

  return (
    <View style={styles.selectionBar(theme)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="선택한 메모 삭제"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={state.requestDelete}
        style={styles.deleteAction(disabled)}
      >
        <Feather name="trash-2" size={design.icon.header} color={theme.red} />
      </Pressable>
    </View>
  );
}

function EmptyMemos() {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <Feather name="file-text" size={44} color={theme.muted} />
      <Label style={styles.emptyTitle}>아직 메모가 없어요</Label>
    </View>
  );
}

function MemoRow({ memo, state }: { memo: Memo; state: MemoState }) {
  const theme = useTheme();
  const selected = state.selected.has(memo.id);

  function press() {
    const selecting = state.selecting;

    if (selecting) {
      state.toggleSelection(memo.id);

      return;
    }
    state.open(memo);
  }

  return (
    <Pressable
      accessibilityRole={state.selecting ? 'checkbox' : 'button'}
      accessibilityLabel={memoFields(memo).title || '제목 없음'}
      accessibilityState={{ checked: selected, disabled: state.disabled }}
      disabled={state.disabled}
      onPress={press}
      onLongPress={() => state.toggleSelection(memo.id)}
      style={styles.memoRow(theme, selected)}
    >
      <SelectionMark selected={selected} visible={state.selecting} />
      <MemoPreview memo={memo} />
    </Pressable>
  );
}

function SelectionMark({ selected, visible }: { selected: boolean; visible: boolean }) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.selectionMark(theme, selected)}>
      {selected ? <Feather name="check" size={16} color={theme.onAccent} /> : null}
    </View>
  );
}

function MemoPreview({ memo }: { memo: Memo }) {
  const theme = useTheme();
  const fields = memoFields(memo);

  return (
    <View style={styles.rowContent}>
      <Text numberOfLines={1} style={styles.memoTitle(theme)}>
        {fields.title || '제목 없음'}
      </Text>
      {fields.body ? (
        <Text numberOfLines={1} style={styles.preview(theme)}>
          {fields.body}
        </Text>
      ) : null}
      <Label muted style={styles.timestamp}>
        {new Date(memo.updatedAt).toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Label>
    </View>
  );
}

function MemoEditor({ state }: { state: MemoState }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + HEADER_HEIGHT + 1}
    >
      <TextInput
        multiline
        accessibilityLabel="메모 본문"
        placeholder="메모를 적어보세요."
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        value={state.content}
        editable={!state.disabled}
        maxLength={Math.max(0, MEMO_MAX_LENGTH - state.title.length)}
        onChangeText={state.setContent}
        textAlignVertical="top"
        style={styles.editor(theme)}
      />
      <MemoValidation state={state} />
    </KeyboardAvoidingView>
  );
}

function MemoValidation({ state }: { state: MemoState }) {
  const theme = useTheme();
  const message = state.lengthError ?? state.limitNotice;

  if (!message) {
    return null;
  }

  return <Label style={styles.validation(theme, Boolean(state.lengthError))}>{message}</Label>;
}
