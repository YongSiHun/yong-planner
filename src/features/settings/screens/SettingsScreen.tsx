import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import fontNotice from '../../../../assets/fonts/NOTICE.json';
import { Button, Label, styles as layoutStyles, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { usePlanner } from '../../../stores/planner';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import { HolidayOverrides } from '../components/HolidayOverrides';
import { TimeFormatSettings } from '../components/TimeFormatSettings';
import { useAlarmSettings } from '../hooks/useAlarmSettings';
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
    <View style={layoutStyles.section}>
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
    </View>
  );
}

function BackupSettings() {
  const actions = useBackupState();
  const isRestoring = usePlanner((state) => state.restoring);
  const isDisabled = actions.isBusy || isRestoring;
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <View style={layoutStyles.section}>
      <View style={layoutStyles.row}>
        <Label style={styles.backupSettingsLabelStyle}>데이터 복원</Label>
        <Button
          compact
          title="?"
          accessibilityLabel="데이터 백업 방법"
          onPress={() => setGuideOpen(true)}
        />
      </View>
      <Button
        title="JSON 백업에서 복원"
        style={styles.settingsButtonStyle}
        disabled={isDisabled}
        onPress={actions.handleRestore}
      />
      {guideOpen ? (
        <Dialog title="데이터 백업 방법" onClose={() => setGuideOpen(false)}>
          <Label>1. 달력에서 백업할 월을 선택하세요.</Label>
          <Label>2. 우측 메뉴 → 내보내기 → JSON 파일 공유를 누르세요.</Label>
          <Label>
            3. 파일 앱이나 클라우드에 yongplanner-2026-11.json 같은 이름으로 저장하세요.
          </Label>
          <Label muted>
            월마다 따로 백업해 주세요. JSON에는 해당 월의 일정과 반복 일정, 시간, 중요 표시가
            저장됩니다.
          </Label>
          <Label muted>
            설정 → JSON 백업에서 복원으로 불러오면 해당 월의 일정만 교체합니다. 기존 전체 백업
            파일도 복원할 수 있습니다. TXT와 CSV는 열람·공유용이며 복원할 수 없습니다.
          </Label>
        </Dialog>
      ) : null}
    </View>
  );
}

function AlarmSettings() {
  const { busy, requestDelete } = useAlarmSettings();
  const unavailable = usePlanner((state) => !state.ready || state.restoring);

  return (
    <View style={layoutStyles.section}>
      <Label style={styles.backupSettingsLabelStyle}>알람</Label>
      <Button
        title="모든 알람 삭제"
        danger
        style={styles.settingsButtonStyle}
        disabled={busy || unavailable}
        onPress={requestDelete}
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

        <AlarmSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />

        <BackupSettings />
        <View style={styles.settingsScreenViewStyle(theme)} />

        <HolidayOverrides />

        <View style={layoutStyles.row}>
          <Label muted>용플래너 {version}</Label>
          <Button compact title="라이선스 정보" onPress={() => setLicenseOpen(true)} />
        </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}
