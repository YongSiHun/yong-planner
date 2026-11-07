import { Text, View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';

export function CopyBar({
  content,
  count,
  onCopy,
  onCancel,
}: {
  content: string;
  count: number;
  onCopy(): void;
  onCancel(): void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.bg,
        borderTopWidth: 1,
        borderTopColor: theme.line,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: design.font.medium,
            color: theme.text,
            fontSize: design.type.small,
          }}
        >
          {content}
        </Text>
        <Button compact title="취소" onPress={onCancel} />
      </View>
      <Label muted style={{ fontSize: design.type.small, lineHeight: 18 }}>
        복사할 날짜를 본문에서 누르세요.
      </Label>
      <Button
        compact
        title={count + '일에 복사'}
        disabled={count === 0}
        onPress={onCopy}
        textColor={theme.onAccent}
        style={{ backgroundColor: theme.accent }}
      />
    </View>
  );
}
