import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, View } from 'react-native';
import { Label, useTheme } from '../../../components/ui';
import type { Memo } from '../../planner/types';
import { memoFields } from '../services/memo';
import type { MemoRowModel } from '../types/presentation';
import * as styles from './MemoRow.styles';

export function MemoRow({ memo, state }: { memo: Memo; state: MemoRowModel }) {
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
        {memo.deletedAt ? '삭제 · ' : ''}
        {new Date(memo.deletedAt ?? memo.updatedAt).toLocaleString('ko-KR', {
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
