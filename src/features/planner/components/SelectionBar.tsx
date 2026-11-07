import { View } from 'react-native';
import { Button, Label, useTheme } from '../../../components/ui';

export function SelectionBar({
  count,
  onEdit,
  onCopy,
  onTime,
  onDelete,
  onCancel,
}: {
  count: number;
  onEdit(): void;
  onCopy(): void;
  onTime(): void;
  onDelete(): void;
  onCancel(): void;
}) {
  const theme = useTheme();
  const isSingle = count === 1;

  return (
    <View
      style={{
        backgroundColor: theme.bg,
        borderTopWidth: 1,
        borderTopColor: theme.line,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label style={{ fontSize: 13 }}>{count}개 선택</Label>
        <Button compact title="선택 해제" onPress={onCancel} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
        {isSingle ? <Button compact bold title="수정하기" onPress={onEdit} /> : null}
        {isSingle ? <Button compact bold title="시간 설정" onPress={onTime} /> : null}
        {isSingle ? <Button compact bold title="일정 복사" onPress={onCopy} /> : null}
        <Button compact bold title="삭제하기" danger disabled={count === 0} onPress={onDelete} />
      </View>
    </View>
  );
}
