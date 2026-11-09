import Feather from '@expo/vector-icons/Feather';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { formatScheduleContent, parseScheduleTimePrefix } from '../services/time';
import type { TimeFormat } from '../types';
import * as styles from './ScheduleChip.styles';

export function ScheduleChip({
  content,
  important = false,
  time,
  timeFormat = '24h',
  onPress,
  onLongPress,
  onBefore,
  onAfter,
  selected = false,
  selecting = false,
}: {
  content: string;
  important?: boolean;
  time?: string | null;
  timeFormat?: TimeFormat;
  onPress(): void;
  onLongPress(): void;
  onBefore?(): void;
  onAfter?(): void;
  selected?: boolean;
  selecting?: boolean;
}) {
  const theme = useTheme();
  const hasContent = content.trim().length > 0;
  const parsed = parseScheduleTimePrefix(content.trim());
  const label = formatScheduleContent(parsed.content, parsed.time ?? time, timeFormat);

  if (!hasContent) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole={selecting ? 'checkbox' : 'button'}
      accessibilityLabel={chipAccessibilityLabel(label, important)}
      accessibilityState={{ selected, checked: selected }}
      accessibilityHint="길게 누르면 여러 일정을 선택할 수 있어요."
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.chip(selected, theme, important)}
    >
      {selected ? <Feather name="check" size={14} color={theme.onAccent} /> : null}
      <ImportantMark important={important} selected={selected} />
      <Text style={styles.chipLabel(selected, theme, important)}>{label}</Text>
      <ChipEdges
        selecting={selecting}
        content={content}
        onBefore={onBefore}
        onAfter={onAfter}
        onLongPress={onLongPress}
        onPress={onPress}
      />
    </Pressable>
  );
}

function ChipEdge({
  side,
  label,
  onPress,
  onLongPress,
}: {
  side: 'left' | 'right';
  label: string;
  onPress?: () => void;
  onLongPress(): void;
}) {
  const canPress = onPress !== undefined;

  if (!canPress) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={2}
      style={styles.chipEdge(side)}
    />
  );
}

function ChipEdges({
  selecting,
  content,
  onBefore,
  onAfter,
  onLongPress,
  onPress,
}: {
  selecting: boolean;
  content: string;
  onBefore?: () => void;
  onAfter?: () => void;
  onLongPress(): void;
  onPress(): void;
}) {
  // 선택 전환 중 native 터치 대상 유지.
  return (
    <>
      <ChipEdge
        side="left"
        label={content.trim() + (selecting ? ' 선택' : ' 앞에 입력')}
        onPress={selecting ? onPress : onBefore}
        onLongPress={onLongPress}
      />
      <ChipEdge
        side="right"
        label={content.trim() + (selecting ? ' 선택' : ' 뒤에 입력')}
        onPress={selecting ? onPress : onAfter}
        onLongPress={onLongPress}
      />
    </>
  );
}

function chipAccessibilityLabel(label: string, important: boolean): string {
  return label + (important ? ', 중요 일정' : ', 일정');
}

function ImportantMark({ important, selected }: { important: boolean; selected: boolean }) {
  const theme = useTheme();

  if (!important) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.importantMark(selected, theme)}>
      <Feather name="star" size={14} color={selected ? theme.onAccent : theme.accent} />
    </View>
  );
}
