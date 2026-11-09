import { View } from 'react-native';
import { Button, Label, styles as layoutStyles } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import { formatScheduleContent } from '../../planner/services/time';
import * as styles from './TimeFormatSettings.styles';

export function TimeFormatSettings() {
  const { setTimeFormat } = usePlannerActions();
  const format = usePlanner((state) => state.data.settings.timeFormat ?? '24h');

  return (
    <View style={layoutStyles.section}>
      <View style={layoutStyles.row}>
        <Label style={styles.timeFormatSettingsLabelStyle}>시간 표시</Label>
        <Label muted style={styles.timeFormatSettingsLabelStyle2}>
          {'예) ' + formatScheduleContent('빨래하기', '13:00', format)}
        </Label>
      </View>
      <View style={layoutStyles.row}>
        <Button title="24시간제" selected={format === '24h'} onPress={() => setTimeFormat('24h')} />
        <Button title="12시간제" selected={format === '12h'} onPress={() => setTimeFormat('12h')} />
      </View>
    </View>
  );
}
