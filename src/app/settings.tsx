import { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Label, report, styles, useTheme } from '../components/ui';
import { usePlanner } from '../stores/planner';
import { backupFile, chooseBackup } from '../services/export/files';
import { HolidayOverrides } from '../features/settings/components/HolidayOverrides';
import type { PlannerData } from '../features/planner/types';

const themeOptions = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
] as const;

function ThemeSettings() {
  const selectedTheme = usePlanner((state) => state.data.settings.theme);

  function handleThemeChange(theme: PlannerData['settings']['theme']) {
    usePlanner.getState().update((data) => ({ ...data, settings: { theme } }), true);
  }

  return (
    <>
      <Label style={{ marginTop: 20, fontWeight: '700' }}>화면 테마</Label>
      <View style={styles.row}>
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            selected={selectedTheme === option.value}
            onPress={() => handleThemeChange(option.value)}
          />
        ))}
      </View>
    </>
  );
}

function useBackupActions() {
  const [isBusy, setBusy] = useState(false);
  const operationBusy = useRef(false);

  async function runAction(action: () => Promise<void>) {
    const isRunning = operationBusy.current;

    if (isRunning) {
      return;
    }

    operationBusy.current = true;
    setBusy(true);

    try {
      await action();
    } catch (error) {
      report(error);
    } finally {
      operationBusy.current = false;
      setBusy(false);
    }
  }

  async function handleBackup() {
    await usePlanner.getState().flush();
    await backupFile(usePlanner.getState().data);
  }

  async function restoreBackup(data: PlannerData) {
    await usePlanner.getState().restore(data);
    Alert.alert('복원 완료', '백업의 일정을 모두 불러왔습니다.');
  }

  async function handleRestore() {
    const backup = await chooseBackup();
    const hasBackup = backup !== null;

    if (!hasBackup) {
      return;
    }

    Alert.alert(
      '전체 데이터 복원',
      '현재 일정을 백업 파일의 데이터로 교체합니다. 먼저 JSON 백업을 보관하는 것을 권장합니다. 복원할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 교체',
          style: 'destructive',
          onPress: () => {
            void runAction(() => restoreBackup(backup));
          },
        },
      ],
    );
  }

  return {
    isBusy,
    handleBackup: () => {
      void runAction(handleBackup);
    },
    handleRestore: () => {
      void runAction(handleRestore);
    },
  };
}

function BackupSettings() {
  const actions = useBackupActions();
  const isRestoring = usePlanner((state) => state.restoring);
  const isDisabled = actions.isBusy || isRestoring;
  const backupTitle = actions.isBusy ? '처리 중…' : 'JSON 백업 파일 공유';

  return (
    <>
      <Label style={{ fontWeight: '700' }}>데이터 보관</Label>
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
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
    >
      <ThemeSettings />
      <View style={{ height: 1, backgroundColor: theme.line }} />

      <BackupSettings />
      <View style={{ height: 1, backgroundColor: theme.line }} />

      <HolidayOverrides />

      <Label muted>용플래너 {version}</Label>
      <Label muted style={{ fontSize: 12 }}>
        공휴일: date-holidays / commenthol · ISC 및 CC BY 3.0{'\n'}
        github.com/commenthol/date-holidays
      </Label>
    </ScrollView>
  );
}
