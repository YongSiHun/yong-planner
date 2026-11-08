import { Pressable, View } from 'react-native';
import { NOTE_SEPARATOR } from '../services/note';
import type { SchedulePreviewProps } from '../types/presentation';
import * as styles from './SchedulePreview.styles';
import { ScheduleChip } from './ScheduleChip';

export function SchedulePreview({
  note,
  noteTimes = [],
  noteImportant = [],
  timeFormat = '24h',
  date,
  onEdit,
  onArm,
  onOutsidePress,
  onChipLayout,
  draggingIndex,
  overlay,
  onInsert,
  selecting = false,
  selectedIndexes = new Set<number>(),
  onSelect = () => {},
}: SchedulePreviewProps) {
  const hasContent = note.split(NOTE_SEPARATOR).some((part) => part.trim().length > 0);

  function handleBlankPress() {
    if (selecting) {
      onOutsidePress?.();

      return;
    }
    onEdit(hasContent ? undefined : 0);
  }

  if (!hasContent) {
    return (
      <Pressable
        onPress={handleBlankPress}
        accessibilityRole="button"
        accessibilityLabel={date + ', 일정 입력'}
        style={styles.emptyPreview}
      ></Pressable>
    );
  }

  return (
    <Pressable accessible={false} onPress={handleBlankPress} style={styles.preview}>
      {note.split(NOTE_SEPARATOR).map((part, index) => (
        <View
          key={index}
          onLayout={(event) => onChipLayout?.(index, event)}
          style={styles.chipWrapper(draggingIndex, index)}
        >
          <ScheduleChip
            content={part}
            important={noteImportant[index]}
            time={noteTimes[index]}
            timeFormat={timeFormat}
            selected={selectedIndexes.has(index)}
            selecting={selecting}
            onLongPress={() => {
              onArm?.(index);
              onSelect(index, true);
            }}
            onPress={() => (selecting ? onSelect(index) : onEdit(index))}
            onBefore={() => onInsert?.(index)}
            onAfter={() => onInsert?.(index + 1)}
          />
        </View>
      ))}
      {overlay}
    </Pressable>
  );
}
