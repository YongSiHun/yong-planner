import Feather from '@expo/vector-icons/Feather';
import { FlatList, Pressable, View } from 'react-native';
import { design, Label, useTheme } from '../../../components/ui';
import { MemoRow } from './MemoRow';
import type { MemoListModel } from '../types/presentation';
import * as styles from './MemoList.styles';

export function MemoList({ state }: { state: MemoListModel }) {
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
        ListEmptyComponent={<EmptyMemos trashOpen={state.trashOpen} />}
        ListFooterComponent={
          <Pressable accessible={false} onPress={state.cancelSelection} style={styles.blankSpace} />
        }
        ListFooterComponentStyle={styles.listFooter}
      />
      <MemoSelectionActions state={state} />
      <MemoAddButton state={state} />
    </Pressable>
  );
}

function MemoAddButton({ state }: { state: MemoListModel }) {
  const theme = useTheme();

  const hidden = state.selecting || state.trashOpen;

  if (hidden) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="메모 추가"
      accessibilityState={{ disabled: state.disabled }}
      disabled={state.disabled}
      onPress={() => state.open(null)}
      style={styles.floatingAction(theme, state.disabled)}
    >
      <Feather name="plus" size={24} color={theme.onAccent} />
    </Pressable>
  );
}

function MemoSelectionActions({ state }: { state: MemoListModel }) {
  const theme = useTheme();
  const selecting = state.selecting;
  const disabled = state.disabled || state.selected.size === 0;

  if (!selecting) {
    return null;
  }

  return (
    <View style={styles.selectionBar(theme)}>
      <MemoSelectionButton state={state} disabled={disabled} />
    </View>
  );
}

function MemoSelectionButton({ state, disabled }: { state: MemoListModel; disabled: boolean }) {
  const theme = useTheme();
  const label = state.trashOpen ? '선택한 메모 복구' : '선택한 메모 삭제';
  const icon = state.trashOpen ? 'rotate-ccw' : 'trash-2';
  const color = state.trashOpen ? theme.accent : theme.red;
  const onPress = state.trashOpen
    ? () => {
        void state.restore();
      }
    : state.requestDelete;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.deleteAction(disabled)}
    >
      <Feather name={icon} size={design.icon.header} color={color} />
    </Pressable>
  );
}

function EmptyMemos({ trashOpen }: { trashOpen: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <Feather name="file-text" size={44} color={theme.muted} />
      <Label style={styles.emptyTitle}>
        {trashOpen ? '휴지통이 비어 있어요' : '아직 메모가 없어요'}
      </Label>
    </View>
  );
}
