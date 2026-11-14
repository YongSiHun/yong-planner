import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import type { Memo } from '../../planner/types';
import { useMemoState } from '../hooks/useMemoState';
import * as styles from './NotesScreen.styles';

type MemoState = ReturnType<typeof useMemoState>;

export default function NotesScreen() {
  const theme = useTheme();
  const state = useMemoState();
  const { memos, error, disabled, open, run, actions } = state;

  return (
    <SafeAreaView style={styles.screen(theme)} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.toolbar}>
          <Button title="메모 추가" disabled={disabled} onPress={() => open(null)} />
          <Button
            title="메모 내보내기"
            disabled={disabled}
            onPress={() => {
              void run(actions.exportMemos);
            }}
          />
        </View>
        <Label muted>장기 일정이나 날짜가 정해지지 않은 계획을 자유롭게 기록하세요.</Label>
        {error ? <Label>{error}</Label> : null}
        {memos.length === 0 ? <Label muted>등록된 메모가 없어요.</Label> : null}
        <View style={styles.grid}>
          {memos.map((memo) => (
            <MemoCard key={memo.id} memo={memo} disabled={disabled} onOpen={open} />
          ))}
        </View>
      </ScrollView>
      <MemoEditor state={state} />
    </SafeAreaView>
  );
}

function MemoCard({
  memo,
  disabled,
  onOpen,
}: {
  memo: Memo;
  disabled: boolean;
  onOpen(memo: Memo): void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={memo.content}
      disabled={disabled}
      style={styles.card(theme, width >= 700)}
      onPress={() => onOpen(memo)}
    >
      <Text numberOfLines={8} style={styles.text(theme)}>
        {memo.content}
      </Text>
      <Label muted style={styles.timestamp}>
        수정 {new Date(memo.updatedAt).toLocaleString('ko-KR')}
      </Label>
    </Pressable>
  );
}

function MemoEditor({ state }: { state: MemoState }) {
  const { editing, content, disabled, setContent, requestDelete, run, save } = state;
  const hidden = editing === undefined;

  if (hidden) {
    return null;
  }

  return (
    <Dialog title={editing ? '메모 수정' : '메모 추가'} onClose={() => closeEditor(state)}>
      <Input
        multiline
        autoFocus
        accessibilityLabel="메모 내용"
        placeholder="메모를 입력하세요"
        value={content}
        maxLength={100000}
        onChangeText={setContent}
        style={styles.editor}
      />
      <View style={styles.actions}>
        {editing ? (
          <Button title="삭제" danger disabled={disabled} onPress={() => requestDelete(editing)} />
        ) : null}
        <Button
          title="저장"
          disabled={disabled || content.trim().length === 0}
          onPress={() => {
            void run(save);
          }}
        />
      </View>
    </Dialog>
  );
}

function closeEditor(state: MemoState) {
  const canClose = !state.busy;

  if (canClose) {
    state.setEditing(undefined);
  }
}
