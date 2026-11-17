import { Pressable, Text, type ViewStyle } from 'react-native';
import { useTheme } from './theme';
import * as styles from './Button.styles';

interface ButtonProps {
  title: string;
  onPress(): void;
  disabled?: boolean;
  onDisabledPress?(): void;
  selected?: boolean;
  danger?: boolean;
  textColor?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  compact?: boolean;
  bold?: boolean;
  labelSize?: number;
}

export function Button({
  title,
  onPress,
  disabled = false,
  onDisabledPress,
  selected = false,
  danger = false,
  textColor,
  accessibilityLabel,
  style,
  compact = false,
  bold = false,
  labelSize,
}: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, selected }}
      disabled={disabled && !onDisabledPress}
      onPress={disabled ? onDisabledPress : onPress}
      style={styles.button(compact, selected, theme, disabled, style)}
    >
      <Text style={styles.buttonLabel(textColor, danger, theme, labelSize, selected, bold)}>
        {title}
      </Text>
    </Pressable>
  );
}
