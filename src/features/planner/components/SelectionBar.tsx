import Feather from '@expo/vector-icons/Feather';
import { type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import * as styles from './SelectionBar.styles';

export function SelectionBar({
  count,
  onCopy,
  onTime,
  onAlarm,
  onDelete,
}: {
  count: number;
  onCopy(): void;
  onTime(): void;
  onAlarm(): void;
  onDelete(): void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container(theme)}>
      <View style={styles.actions}>
        <SheetAction icon="clock" title="시간 설정" disabled={count === 0} onPress={onTime} />
        <SheetAction
          icon="copy"
          title="일정 복사"
          disabled={count === 0}
          onDisabledPress={onCopy}
          onPress={onCopy}
        />
        <SheetAction icon="bell" title="알람 설정" disabled={count === 0} onPress={onAlarm} />
        <SheetAction icon="trash-2" title="삭제" disabled={count === 0} onPress={onDelete} />
      </View>
    </View>
  );
}

function SheetAction({
  icon,
  title,
  disabled,
  onDisabledPress,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  disabled: boolean;
  onDisabledPress?(): void;
  onPress(): void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled && !onDisabledPress}
      onPress={disabled ? onDisabledPress : onPress}
      style={styles.actionState(disabled, theme)}
    >
      <Feather name={icon} size={22} color={theme.accent} />
      <Text style={styles.label(theme)}>{title}</Text>
    </Pressable>
  );
}
