import {
  buttonLabelSize,
  section,
  heading,
  row,
  option as optionStyle,
} from '../../../components/ui/settings.styles';
import { View } from 'react-native';
import { Button, Label } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';

const themeOptions = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
] as const;

export function ThemeSettings() {
  const { setTheme } = usePlannerActions();
  const selectedTheme = usePlanner((state) => state.data.settings.theme);

  return (
    <View style={section}>
      <Label style={heading}>화면 테마</Label>
      <View style={row}>
        {themeOptions.map((option) => (
          <Button
            labelSize={buttonLabelSize}
            key={option.value}
            style={optionStyle}
            title={option.label}
            selected={selectedTheme === option.value}
            onPress={() => setTheme(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
