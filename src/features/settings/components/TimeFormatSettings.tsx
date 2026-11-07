import { View } from 'react-native';
import { Button, Label, styles } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import type { TimeFormat } from '../../planner/types';
import { formatScheduleContent } from '../../planner/services/time';

export function TimeFormatSettings() {
  const format = usePlanner((state) => state.data.settings.timeFormat ?? '24h');

  function choose(timeFormat: TimeFormat) {
    usePlanner
      .getState()
      .update((data) => ({ ...data, settings: { ...data.settings, timeFormat } }), true);
  }

  return (
    <>
      <Label style={{ fontWeight: '700' }}>시간 표시</Label>
      <View style={styles.row}>
        <Button title="24시간제" selected={format === '24h'} onPress={() => choose('24h')} />
        <Button title="12시간제" selected={format === '12h'} onPress={() => choose('12h')} />
      </View>
      <Label muted style={{ fontSize: 13 }}>
        {formatScheduleContent('밥먹기', '13:00', format)}
      </Label>
    </>
  );
}
