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
import { Button, Label, useTheme } from '../../../components/ui';
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
        <Label style={heading}>데이터 복원</Label>
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
        style={filledButton(theme)}
        disabled={isDisabled}
        onPress={actions.handleRestore}
      />
      {guideOpen ? (
        <Dialog title="데이터 백업 방법" compactHeader onClose={() => setGuideOpen(false)}>
          <Label>1. 달력에서 백업할 월을 선택하세요.</Label>
          <Label>2. 메뉴 → 내보내기 → JSON 파일 공유로 저장하세요.</Label>
        </Dialog>
      ) : null}
    </View>
  );
}
