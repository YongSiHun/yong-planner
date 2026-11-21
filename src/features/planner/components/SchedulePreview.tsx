import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { useMemo, useRef } from 'react';
import { NOTE_SEPARATOR } from '../services/noteText';
import { useNoteSelectionStore } from '../../../stores/noteSelection';
import type { SchedulePreviewProps } from '../types/presentation';
import * as styles from './SchedulePreview.styles';
import { ScheduleChip } from './ScheduleChip';
import { dropTarget, type ChipBounds } from '../services/dragGeometry';

export function SchedulePreview({
  note,
  noteTimes = [],
  noteImportant = [],
  noteAlarms = [],
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
  const parts = useMemo(
    () =>
      note
        .split(NOTE_SEPARATOR)
        .map((part, index) => ({ part, index }))
        .filter(({ part }) => part.trim().length > 0),
    [note],
  );
  const hasContent = parts.length > 0;
  const blankIndex = hasContent ? undefined : 0;
  const boxes = useRef(new Map<number, ChipBounds>());

  function handleBlankPress(event?: GestureResponderEvent) {
    const active = selecting || useNoteSelectionStore.getState().active;

    if (active) {
      onOutsidePress?.();

      return;
    }
    const visibleBoxes = new Map(
      [...boxes.current].filter(([index]) => parts.some((part) => part.index === index)),
    );
    const target = insertionTarget(visibleBoxes, event);
    const canInsert = target !== null && onInsert !== undefined;

    if (canInsert) {
      onInsert(target.boundary);

      return;
    }
    onEdit(blankIndex);
  }

  function handleChipPress(index: number) {
    const active = selecting || useNoteSelectionStore.getState().active;

    if (active) {
      onSelect(index);

      return;
    }
    onEdit(index);
  }

  function handleInsertion(index: number, boundary: number) {
    const active = selecting || useNoteSelectionStore.getState().active;

    if (active) {
      onSelect(index);

      return;
    }
    onInsert?.(boundary);
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
      {parts.map(({ part, index }) => (
        <View
          key={index}
          onLayout={(event) => {
            boxes.current.set(index, event.nativeEvent.layout);
            onChipLayout?.(index, event);
          }}
          style={styles.chipWrapper(draggingIndex, index)}
        >
          <ScheduleChip
            content={part}
            important={noteImportant[index]}
            alarm={noteAlarms[index]}
            time={noteTimes[index]}
            timeFormat={timeFormat}
            selected={selectedIndexes.has(index)}
            selecting={selecting}
            onLongPress={() => {
              onSelect(index, true);
              onArm?.(index);
            }}
            onPress={() => handleChipPress(index)}
            onBefore={() => handleInsertion(index, index)}
            onAfter={() => handleInsertion(index, index + 1)}
          />
        </View>
      ))}
      {overlay}
    </Pressable>
  );
}

function insertionTarget(boxes: ReadonlyMap<number, ChipBounds>, event?: GestureResponderEvent) {
  const hasEvent = event !== undefined;

  if (!hasEvent) {
    return null;
  }

  return dropTarget(boxes, event.nativeEvent.locationX, event.nativeEvent.locationY);
}
