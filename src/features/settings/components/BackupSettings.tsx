import {
  buttonLabelSize,
  section,
  heading,
  filledButton,
  headingRow,
} from '../../../components/ui/settings.styles';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Label, design, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { usePlanner } from '../../../stores/planner';
import { useBackupState } from '../hooks/useBackupState';
import * as styles from './BackupSettings.styles';

export function BackupSettings() {
  const theme = useTheme();
  const actions = useBackupState();
  const isRestoring = usePlanner((state) => state.restoring);
  const isDisabled = actions.isBusy || isRestoring;
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <View style={section}>
      <View style={headingRow}>
        <Label style={heading}>데이터 백업 · 복원</Label>
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
        title="JSON / ZIP 파일로 복원"
        style={filledButton(theme)}
        disabled={isDisabled}
        onPress={actions.handleRestore}
      />
      <Button
        labelSize={buttonLabelSize}
        title={actions.isBusy ? '처리 중…' : '전체 데이터 백업 (ZIP)'}
        style={filledButton(theme)}
        disabled={isDisabled}
        onPress={actions.handleBackup}
      />
      <Label muted>JSON은 월별 일정 또는 메모 복원, ZIP은 전체 데이터 복원입니다.</Label>
      {guideOpen ? (
        <Dialog
          titleSize={design.type.title}
          title="데이터 백업 방법"
          compactHeader
          onClose={() => setGuideOpen(false)}
        >
          <Label>1. 달력에서 백업할 월을 선택하세요.</Label>
          <Label>2. 메뉴 → 내보내기 → JSON 파일 공유로 저장하세요.</Label>
          <Label>메모는 전체 데이터 백업에 함께 저장됩니다.</Label>
          <Label>
            전체 데이터 백업은 일정·메모·설정을 ZIP으로 저장합니다. 데이터가 많으면 시간이 오래 걸릴
            수 있습니다.
          </Label>
          <Label>
            파일이 보이지 않으면 파일 선택기의 탐색 메뉴에서 다운로드, 기기 저장 공간 또는 연결된
            클라우드를 선택하세요. 클라우드 파일은 먼저 내려받아 주세요. 접근이 제한된 폴더의 백업은
            다운로드(Android) 또는 파일 앱의 나의 iPhone/iPad·iCloud Drive(iOS)로 옮겨 주세요.
          </Label>
          <Label>ZIP 전체 복원은 현재의 모든 데이터를 덮어씁니다.</Label>
        </Dialog>
      ) : null}
    </View>
  );
}
