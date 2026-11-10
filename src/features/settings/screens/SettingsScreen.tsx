import { buttonLabelSize } from '../../../components/ui/settings.styles';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <View style={styles.section}>
      <Label style={styles.themeSettingsLabelStyle}>화면 테마</Label>
      <View style={styles.row}>
        {themeOptions.map((option) => (
          <Button
            labelSize={buttonLabelSize}
            key={option.value}
            style={styles.option}
            title={option.label}
            selected={selectedTheme === option.value}
            onPress={() => setTheme(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function BackupSettings() {
  const theme = useTheme();
  const actions = useBackupState();
  const isRestoring = usePlanner((state) => state.restoring);
  const isDisabled = actions.isBusy || isRestoring;
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Label style={styles.backupSettingsLabelStyle}>데이터 복원</Label>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="데이터 백업 방법"
          style={styles.helpButton(theme)}
          onPress={() => setGuideOpen(true)}
        >
          <Feather name="help-circle" size={18} color={theme.accent} />
        </Pressable>
      </View>
      <Button
        labelSize={buttonLabelSize}
        title="JSON 백업에서 복원"
        style={styles.settingsButtonStyle(theme)}
        disabled={isDisabled}
        onPress={actions.handleRestore}
      />
      {guideOpen ? (
        <Dialog title="데이터 백업 방법" onClose={() => setGuideOpen(false)}>
          <Label>1. 달력에서 백업할 월을 선택하세요.</Label>
          <Label>2. 메뉴 → 내보내기 → JSON 파일 공유로 저장하세요.</Label>
        </Dialog>
      ) : null}
    </View>
  );
}

function NotificationSettings() {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Label style={styles.backupSettingsLabelStyle}>알림</Label>
      <Button
        labelSize={buttonLabelSize}
        title="알림 설정"
        style={styles.settingsButtonStyle(theme)}
        onPress={() => router.push('/notifications')}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const [licenseOpen, setLicenseOpen] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={layoutStyles.surface} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.settingsScreenScrollViewStyle(theme)}
        contentContainerStyle={styles.settingsScreenScrollViewContentContainerStyle}
      >
        <ThemeSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />
        <TimeFormatSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />

        <NotificationSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />

        <BackupSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />

        <HolidayOverrides />
        <View style={styles.settingsScreenViewStyle(theme)} />
        <View style={styles.section}>
          <Label style={styles.backupSettingsLabelStyle}>앱 정보</Label>
          <Button
            labelSize={buttonLabelSize}
            style={styles.settingsButtonStyle(theme)}
            title={'용플래너 ' + version}
            accessibilityLabel={'용플래너 ' + version + ', 라이선스 정보 열기'}
            onPress={() => setLicenseOpen(true)}
          />
        </View>
      </ScrollView>
      {licenseOpen ? (
        <Dialog title="라이선스 정보" onClose={() => setLicenseOpen(false)}>
          <Label style={styles.backupSettingsLabelStyle}>Pretendard</Label>
          <Label muted>{fontNotice.copyright}</Label>
          <Label muted style={styles.settingsScreenLabelStyle}>
            {fontNotice.license}
          </Label>
          <Label style={styles.backupSettingsLabelStyle}>공휴일 데이터</Label>
          <Label muted style={styles.settingsScreenLabelStyle2}>
            공휴일: date-holidays / commenthol · ISC 및 CC BY 3.0{'\n'}
            github.com/commenthol/date-holidays
          </Label>
        </Dialog>
      ) : null}
    </SafeAreaView>
  );
}
