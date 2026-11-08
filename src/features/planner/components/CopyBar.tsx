import { Text, View } from 'react-native';
import { Button, Label, useTheme } from '../../../components/ui';
import * as styles from './CopyBar.styles';

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
    <View style={styles.copyBarViewStyle(theme)}>
      <View style={styles.copyBarViewStyle2}>
        <Text numberOfLines={1} style={styles.copyBarTextStyle(theme)}>
          {content}
        </Text>
        <Button compact title="취소" onPress={onCancel} />
      </View>
      <Label muted style={styles.copyBarLabelStyle}>
        복사할 날짜를 본문에서 누르세요.
      </Label>
      <Button
        compact
        title={count + '일에 복사'}
        disabled={count === 0}
        onPress={onCopy}
        textColor={theme.onAccent}
        style={styles.copyBarButtonStyle(theme)}
      />
    </View>
  );
}
