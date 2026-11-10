import { buttonLabelSize } from '../../../components/ui/settings.styles';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Label, styles as layoutStyles, useTheme } from '../../../components/ui';
import { Toggle } from '../../../components/ui/Toggle';
import { usePlanner } from '../../../stores/planner';
import { useAlarmSettings } from '../../settings/hooks/useAlarmSettings';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import type { NotificationPreferences } from '../types';
import * as styles from './NotificationsScreen.styles';

function PreferenceSwitch({
  title,
  value,
  disabled,
  onChange,
}: {
  title: string;
  value: boolean;
  disabled: boolean;
  onChange(enabled: boolean): Promise<void>;
}) {
  const [draft, setDraft] = useState<boolean | null>(null);
  const pending = useRef(false);

  async function change(enabled: boolean) {
    const saving = pending.current;

    if (saving) {
      return;
    }
    pending.current = true;
    setDraft(enabled);
    try {
      await onChange(enabled);
    } finally {
      pending.current = false;
      setDraft(null);
    }
  }

  return (
    <View style={styles.row}>
      <Label style={styles.title}>{title}</Label>
      <Toggle
        accessibilityLabel={title}
        value={draft ?? value}
        disabled={disabled}
        onValueChange={(enabled) => {
          void change(enabled);
        }}
      />
    </View>
  );
}
export default function NotificationsScreen() {
  const theme = useTheme();
  const state = useNotificationSettings();
  const disabled = !state.ready || state.busy;
  const granted = state.permission?.granted === true;
  const permissionLabel = granted ? '허용' : '확인 필요';

  function toggle(key: keyof NotificationPreferences, value: boolean) {
    return state.change(key, value);
  }

  return (
    <SafeAreaView style={layoutStyles.surface} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.screen(theme)} contentContainerStyle={styles.content}>
        <View style={styles.displaySection}>
          <Label style={styles.heading}>표시</Label>
          <View style={styles.toggleGroup}>
            <PreferenceSwitch
              title="상태바에 표시"
              value={state.preferences.summary}
              disabled={!state.ready}
              onChange={(value) => toggle('summary', value)}
            />
            <PreferenceSwitch
              title="잠금 화면에 표시"
              value={state.preferences.lockScreen}
              disabled={!state.ready}
              onChange={(value) => toggle('lockScreen', value)}
            />
          </View>
        </View>
        <View style={styles.divider(theme)} />
        <View style={styles.permissionSection}>
          <View style={styles.permissionHeadingRow}>
            <Label style={styles.heading}>알림 권한</Label>
            <Label muted style={styles.permissionValue}>
              {permissionLabel}
            </Label>
          </View>
          <Button
            labelSize={buttonLabelSize}
            title="기기 알림 설정"
            style={styles.textAction(theme)}
            onPress={() => {
              void state.openSettings();
            }}
          />
        </View>
        <View style={styles.divider(theme)} />
        <AlarmSettings />
        <NotificationError
          message={state.error}
          disabled={disabled}
          onRetry={() => {
            void state.retry();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationError({
  message,
  disabled,
  onRetry,
}: {
  message: string | null;
  disabled: boolean;
  onRetry(): void;
}) {
  const theme = useTheme();

  if (!message) {
    return null;
  }

  return (
    <View style={styles.error}>
      <Label style={styles.errorLabel(theme)}>{message}</Label>
      <Button
        labelSize={buttonLabelSize}
        style={styles.textAction(theme)}
        title="다시 시도"
        disabled={disabled}
        onPress={onRetry}
      />
    </View>
  );
}

function AlarmSettings() {
  const theme = useTheme();
  const { busy, requestDelete } = useAlarmSettings();
  const unavailable = usePlanner((state) => !state.ready || state.restoring);

  return (
    <View style={styles.permissionSection}>
      <Label style={styles.heading}>알람</Label>
      <Button
        labelSize={buttonLabelSize}
        title="모든 알람 삭제"
        danger
        style={styles.textAction(theme)}
        disabled={busy || unavailable}
        onPress={requestDelete}
      />
    </View>
  );
}
