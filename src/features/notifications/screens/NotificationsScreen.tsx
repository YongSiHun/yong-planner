import { Platform, ScrollView, Switch, View } from 'react-native';
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
  const lockScreen = lockScreenValue(state.preferences, state.permission?.lockScreen);

  function toggle(key: keyof NotificationPreferences, value: boolean) {
    void state.change(key, value);
  }

  return (
    <SafeAreaView style={layoutStyles.surface} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.screen(theme)} contentContainerStyle={styles.content}>
        <View style={layoutStyles.section}>
          <Label style={styles.heading}>표시</Label>
          <PreferenceSwitch
            title="알림 화면에 표시"
            value={state.preferences.summary}
            disabled={disabled}
            onChange={(value) => toggle('summary', value)}
          />
          <PreferenceSwitch
            title="잠금 화면에 표시"
            value={lockScreen}
            disabled={disabled}
            onChange={(value) => {
              const ios = Platform.OS === 'ios';

              if (ios) {
                void state.openSettings();

                return;
              }
              toggle('lockScreen', value);
            }}
          />
          <LockScreenHint />
          <Label muted style={styles.note}>
            알람은 칩을 길게 눌러 설정해요.
          </Label>
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
          <Label muted style={styles.note}>
            잠금화면 표시는 기기 설정도 따라요.
          </Label>
          <Label muted style={styles.note}>
            예약된 알림 {state.count}개
          </Label>
          {state.truncated ? (
            <Label muted style={styles.note}>
              예약 한도로 가까운 일정부터 알려드려요.
            </Label>
          ) : null}
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

function lockScreenValue(preferences: NotificationPreferences, permission?: boolean): boolean {
  return Platform.OS === 'ios' ? permission === true : preferences.lockScreen;
}

function LockScreenHint() {
  return Platform.OS === 'ios' ? (
    <Label muted style={styles.note}>
      잠금 화면 표시는 기기 알림 설정에서 변경해 주세요.
    </Label>
  ) : null;
}
