import { CopyBar } from './CopyBar';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { design, useTheme } from '../../../components/ui';
import type { useNoteSelection } from '../hooks/useNoteSelection';
import { SelectionBar } from './SelectionBar';

export function PlannerFooter({
  selection,
  keyboardVisible,
  onToday,
}: {
  selection: ReturnType<typeof useNoteSelection>;
  keyboardVisible: boolean;
  onToday(): void;
}) {
  const source = selection.copySource;
  const isCopying = source !== undefined;

  if (isCopying) {
    return (
      <CopyBar
        content={source.content}
        count={selection.copyDates.size}
        onCopy={selection.copySelected}
        onCancel={selection.closeCopy}
      />
    );
  }
  const isSelecting = selection.active;

  if (isSelecting) {
    return (
      <SelectionBar
        count={selection.selected.size}
        onEdit={selection.editSelected}
        onCopy={selection.openCopy}
        onTime={selection.openTime}
        onDelete={selection.deleteSelected}
        onCancel={selection.clear}
      />
    );
  }
  if (keyboardVisible) {
    return null;
  }

  return <TodayButton onPress={onToday} />;
}

function TodayButton({ onPress }: { onPress(): void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', bottom: 12 + insets.bottom, right: 12 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="오늘 날짜로 이동"
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: theme.accent,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.accent,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: design.touchTarget,
          paddingHorizontal: 12,
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            color: theme.onAccent,
            fontSize: design.type.small,
            fontFamily: design.font.semibold,
          }}
        >
          오늘 날짜로 이동
        </Text>
      </Pressable>
    </View>
  );
}
