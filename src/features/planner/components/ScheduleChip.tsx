import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { formatScheduleContent, parseScheduleTimePrefix } from '../services/time';
import type { TimeFormat } from '../types';
import * as styles from './ScheduleChip.styles';

export function ScheduleChip({
  content,
  important = false,
  alarm = false,
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
  alarm?: boolean;
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
  const selectionActive = useNoteSelectionStore((state) => state.active);
  const isSelecting = selecting || selectionActive;
  const label = useMemo(() => {
    const parsed = parseScheduleTimePrefix(content.trim());

    return formatScheduleContent(parsed.content, parsed.time ?? time, timeFormat);
  }, [content, time, timeFormat]);

  const chipStyle = useMemo(
    () => styles.chip(selected, theme, important),
    [selected, theme, important],
  );
  const labelNode = useMemo(
    () => <Text style={styles.chipLabel(selected, theme, important)}>{label}</Text>,
    [selected, theme, important, label],
  );

  if (!hasContent) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole={isSelecting ? 'checkbox' : 'button'}
      accessibilityLabel={chipAccessibilityLabel(label, important) + (alarm ? ', 알람 설정됨' : '')}
      accessibilityState={{ selected, checked: selected }}
      accessibilityHint="길게 누르면 여러 일정을 선택할 수 있어요."
      onPress={onPress}
      onLongPress={onLongPress}
      style={chipStyle}
    >
      <AlarmMark alarm={alarm} selected={selected} />
      {labelNode}
      <ChipEdges
        selecting={isSelecting}
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

function AlarmMark({ alarm, selected }: { alarm: boolean; selected: boolean }) {
  const theme = useTheme();

  if (!alarm) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.importantMark(selected, theme)}>
      <Feather name="bell" size={14} color={selected ? theme.onAccent : theme.accent} />
    </View>
  );
}
