import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import fontNotice from '../../../../assets/fonts/NOTICE.json';
import { Button, Label, styles as layoutStyles, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { usePlanner } from '../../../stores/planner';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import { HolidayOverrides } from '../components/HolidayOverrides';
import { TimeFormatSettings } from '../components/TimeFormatSettings';
import { useBackupState } from '../hooks/useBackupState';
import * as styles from './SettingsScreen.styles';

const themeOptions = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
] as const;

function ThemeSettings() {
  const { setTheme } = usePlannerActions();
  const selectedTheme = usePlanner((state) => state.data.settings.theme);

  return (
    <>
      <Label style={styles.themeSettingsLabelStyle}>화면 테마</Label>
      <View style={layoutStyles.row}>
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            selected={selectedTheme === option.value}
            onPress={() => setTheme(option.value)}
          />
        ))}
      </View>
    </>
  );
}

function BackupSettings() {
  const actions = useBackupState();
  const isRestoring = usePlanner((state) => state.restoring);
  const isDisabled = actions.isBusy || isRestoring;
  const backupTitle = actions.isBusy ? '처리 중…' : 'JSON 백업 파일 공유';

  return (
    <>
      <Label style={styles.backupSettingsLabelStyle}>데이터 보관</Label>
      <Label muted>
        일정은 이 기기에 저장됩니다. 기기를 바꾸기 전에는 JSON 백업 파일을 보관해 주세요.
      </Label>
      <Button title={backupTitle} disabled={isDisabled} selected onPress={actions.handleBackup} />
      <Button title="JSON 백업에서 복원" disabled={isDisabled} onPress={actions.handleRestore} />
    </>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const [licenseOpen, setLicenseOpen] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={styles.settingsScreenScrollViewStyle(theme)}
      contentContainerStyle={styles.settingsScreenScrollViewContentContainerStyle}
    >
      <ThemeSettings />
      <TimeFormatSettings />
      <View style={styles.settingsScreenViewStyle(theme)} />

      <BackupSettings />
      <View style={styles.settingsScreenViewStyle(theme)} />

      <HolidayOverrides />

      <Label muted>용플래너 {version}</Label>
      <Button compact title="Pretendard 글꼴 라이선스" onPress={() => setLicenseOpen(true)} />
      {licenseOpen ? (
        <Dialog title="Pretendard" onClose={() => setLicenseOpen(false)}>
          <Label muted>{fontNotice.copyright}</Label>
          <Label muted style={styles.settingsScreenLabelStyle}>
            {fontNotice.license}
          </Label>
        </Dialog>
      ) : null}
      <Label muted style={styles.settingsScreenLabelStyle2}>
        공휴일: date-holidays / commenthol · ISC 및 CC BY 3.0{'\n'}
        github.com/commenthol/date-holidays
      </Label>
    </ScrollView>
  );
}
