import { View } from 'react-native';
import { Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { monthLabel } from '../../../utils/date';
import * as styles from './DateInfo.styles';

export function DateInfo({ date, name, onClose }: { date: string; name: string; onClose(): void }) {
  const theme = useTheme();

  return (
    <Dialog title={monthLabel(date) + ' ' + Number(date.slice(8)) + '일'} onClose={onClose}>
      <View style={styles.dateInfoViewStyle}>
        <View style={styles.dateInfoViewStyle2(theme)}>
          <Label style={styles.dateInfoLabelStyle(theme)}>{name}</Label>
        </View>
      </View>
    </Dialog>
  );
}
