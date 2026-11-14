import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles as layoutStyles, useTheme } from '../../../components/ui';
import { AppInfo } from '../components/AppInfo';
import { BackupSettings } from '../components/BackupSettings';
import { HolidayOverrides } from '../components/HolidayOverrides';
import { ThemeSettings } from '../components/ThemeSettings';
import { TimeFormatSettings } from '../components/TimeFormatSettings';
import * as styles from './SettingsScreen.styles';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={layoutStyles.surface} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.page(theme)} contentContainerStyle={styles.content}>
        <ThemeSettings />
        <View style={styles.divider(theme)} />
        <TimeFormatSettings />
        <View style={styles.divider(theme)} />

        <BackupSettings />
        <View style={styles.divider(theme)} />

        <HolidayOverrides />
        <View style={styles.divider(theme)} />
        <AppInfo />
      </ScrollView>
    </SafeAreaView>
  );
}
