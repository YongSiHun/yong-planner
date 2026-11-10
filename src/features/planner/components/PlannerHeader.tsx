import Feather from '@expo/vector-icons/Feather';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { monthLabel } from '../../../utils/date';
import * as styles from './PlannerHeader.styles';

function HeaderIcon({
  label,
  children,
  onPress,
  disabled = false,
  edge,
  feedback = true,
}: {
  label: string;
  children: React.ReactNode;
  onPress(): void;
  disabled?: boolean;
  edge?: 'left' | 'right';
  feedback?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={styles.icon(edge, theme, disabled, feedback)}
    >
      {children}
    </Pressable>
  );
}

export function PlannerHeader({
  month,
  onMonth,
  onMenu,
  onGuide,
  onChooseMonth,
}: {
  month: string;
  onMonth(amount: number): void;
  onMenu(): void;
  onGuide(): void;
  onChooseMonth(): void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.header(theme)}>
      <View style={styles.navigation}>
        <HeaderIcon
          edge="left"
          feedback={false}
          label="이전 달"
          disabled={month.startsWith('0001-01')}
          onPress={() => onMonth(-1)}
        >
          <Text style={styles.monthArrow(theme)}>‹</Text>
        </HeaderIcon>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="연도와 월 선택"
          onPress={() => {
            Keyboard.dismiss();
            onChooseMonth();
          }}
          style={styles.monthTrigger}
        >
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={styles.monthTitle(theme)}
          >
            {monthLabel(month)}
          </Text>
        </Pressable>
        <HeaderIcon
          feedback={false}
          label="다음 달"
          disabled={month.startsWith('9999-12')}
          onPress={() => onMonth(1)}
        >
          <Text style={styles.plannerHeaderTextStyle3(theme)}>›</Text>
        </HeaderIcon>
      </View>
      <HeaderIcon feedback={false} edge="right" label="사용 가이드 열기" onPress={onGuide}>
        <Feather name="help-circle" size={22} color={theme.accent} />
      </HeaderIcon>
      <HeaderIcon feedback={false} label="메뉴 열기" onPress={onMenu}>
        <View style={styles.menuLines}>
          {[0, 1, 2].map((line) => (
            <View key={line} style={styles.menuLine(theme)} />
          ))}
        </View>
      </HeaderIcon>
    </View>
  );
}
