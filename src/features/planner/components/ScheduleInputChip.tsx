import { memo } from 'react';
import { View } from 'react-native';
import type { ScheduleInputChipProps } from '../types/presentation';
import { ScheduleChip } from './ScheduleChip';
import * as styles from './ScheduleInputChip.styles';

export const ScheduleInputChip = memo(function ScheduleInputChip({
  entry,
  timeFormat,
  onActivate,
  onRecord,
}: ScheduleInputChipProps) {
  return (
    <View onLayout={(event) => onRecord(entry.key, event)} style={styles.chipWrapper}>
      <ScheduleChip
        content={entry.content}
        important={entry.important}
        alarm={entry.alarm}
        timeFormat={timeFormat}
        onPress={() => onActivate(entry.key, 'edit')}
        onLongPress={() => onActivate(entry.key, 'edit')}
        onBefore={() => onActivate(entry.key, 'before')}
        onAfter={() => onActivate(entry.key, 'after')}
      />
    </View>
  );
});
