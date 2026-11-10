import { Animated, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useChipDrag } from '../hooks/useChipDrag';
import type { SchedulePreviewProps } from '../types/presentation';
import * as styles from './DraggableSchedulePreview.styles';
import { ScheduleChip, SchedulePreview } from './ScheduleInput';

export function DraggableSchedulePreview({
  onMove,
  ...props
}: SchedulePreviewProps & { onMove(from: number, boundary: number): void }) {
  const theme = useTheme();
  const drag = useChipDrag(onMove, props.note.split(',').length, props.date);
  const index = drag.index;
  const box = drag.box;
  const hasOverlay = index !== null && box !== undefined;

  return (
    <View {...drag.handlers} onTouchEnd={drag.releaseArm}>
      <SchedulePreview
        {...props}
        onArm={drag.arm}
        onChipLayout={drag.record}
        draggingIndex={index}
        overlay={
          hasOverlay ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={styles.overlay(box, drag.offset.getTranslateTransform())}
              >
                <ScheduleChip
                  content={props.note.split(',')[index]!}
                  important={props.noteImportant?.[index]}
                  alarm={props.noteAlarms?.[index]}
                  time={props.noteTimes?.[index]}
                  timeFormat={props.timeFormat}
                  onPress={noop}
                  onLongPress={noop}
                />
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={styles.marker(
                  theme,
                  drag.markerHeight,
                  drag.markerOffset.getTranslateTransform(),
                )}
              />
            </>
          ) : null
        }
      />
    </View>
  );
}

function noop() {}
