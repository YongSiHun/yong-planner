import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Label, styles as layoutStyles, useTheme } from '../../../components/ui';
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
  onChange(enabled: boolean): void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Label style={styles.title}>{title}</Label>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={styles.track(theme)}
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
    void state.change(key, value);
  }

  return (
    <SafeAreaView style={layoutStyles.surface} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.screen(theme)} contentContainerStyle={styles.content}>
        <View style={layoutStyles.section}>
          <Label style={styles.heading}>표시</Label>
          <PreferenceSwitch
            title="상태바에 표시"
            value={state.preferences.summary}
            disabled={disabled}
            onChange={(value) => toggle('summary', value)}
          />
          <PreferenceSwitch
            title="잠금 화면에 표시"
            value={state.preferences.lockScreen}
            disabled={disabled}
            onChange={(value) => toggle('lockScreen', value)}
          />
        </View>
        <View style={styles.divider(theme)} />
        <View style={layoutStyles.section}>
          <Label>알림 권한: {permissionLabel}</Label>
          <Button
            title="기기 알림 설정"
            style={styles.textAction}
            onPress={() => {
              void state.openSettings();
            }}
          />
        </View>
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
      <Button style={styles.textAction} title="다시 시도" disabled={disabled} onPress={onRetry} />
    </View>
  );
}
