import Feather from '@expo/vector-icons/Feather';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { design, useTheme } from '../../../components/ui';
import { monthLabel } from '../../../utils/date';

function HeaderIcon({
  label,
  children,
  onPress,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onPress(): void;
  disabled?: boolean;
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
      style={({ pressed }) => ({
        width: design.touchTarget,
        height: design.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: design.radius.small,
        backgroundColor: pressed ? theme.selected : 'transparent',
        flexShrink: 0,
        opacity: disabled ? 0.35 : 1,
      })}
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: design.space.xs,
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <HeaderIcon
          label="이전 달"
          disabled={month.startsWith('0001-01')}
          onPress={() => onMonth(-1)}
        >
          <Text style={{ fontSize: 24, fontFamily: design.font.regular, color: theme.muted }}>
            ‹
          </Text>
        </HeaderIcon>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="연도와 월 선택"
          onPress={() => {
            Keyboard.dismiss();
            onChooseMonth();
          }}
          style={{ flex: 1, minWidth: 0, minHeight: design.touchTarget, justifyContent: 'center' }}
        >
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={{
              color: theme.accent,
              fontSize: design.type.title,
              fontFamily: design.font.bold,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          >
            {monthLabel(month)}
          </Text>
        </Pressable>
        <HeaderIcon
          label="다음 달"
          disabled={month.startsWith('9999-12')}
          onPress={() => onMonth(1)}
        >
          <Text style={{ fontSize: 24, fontFamily: design.font.regular, color: theme.muted }}>
            ›
          </Text>
        </HeaderIcon>
      </View>
      <HeaderIcon label="사용 가이드 열기" onPress={onGuide}>
        <Feather name="help-circle" size={22} color={theme.accent} />
      </HeaderIcon>
      <HeaderIcon label="메뉴 열기" onPress={onMenu}>
        <View style={{ gap: 4 }}>
          {[0, 1, 2].map((line) => (
            <View
              key={line}
              style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: theme.accent }}
            />
          ))}
        </View>
      </HeaderIcon>
    </View>
  );
}
