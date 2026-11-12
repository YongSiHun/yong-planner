import {
  buttonLabelSize,
  section,
  heading,
  filledButton,
} from '../../../components/ui/settings.styles';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Label, useTheme } from '../../../components/ui';

export function NotificationSettings() {
  const theme = useTheme();

  return (
    <View style={section}>
      <Label style={heading}>알림</Label>
      <Button
        labelSize={buttonLabelSize}
        title="알림 설정"
        style={filledButton(theme)}
        onPress={() => router.push('/notifications')}
      />
    </View>
  );
}
