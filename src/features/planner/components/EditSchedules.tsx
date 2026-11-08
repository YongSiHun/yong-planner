import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, showToast } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { noteLengthError } from '../../../services/schedule';
import type { DailyPlanItem } from '../types';
import * as styles from './EditSchedules.styles';

export function EditSchedules({
  items,
  onClose,
  onSave,
}: {
  items: DailyPlanItem[];
  onClose(): void;
  onSave(changes: ReadonlyMap<string, string>): void;
}) {
  const [changes, setChanges] = useState(
    () => new Map(items.map((item) => [item.id, item.content])),
  );

  function change(id: string, value: string) {
    const error = noteLengthError(value);

    if (error) {
      showToast(error);

      return;
    }
    setChanges((previous) => new Map(previous).set(id, value));
  }

  return (
    <Dialog
      title="일정 수정"
      onClose={onClose}
      footer={<Button bold title="저장" onPress={() => onSave(changes)} />}
    >
      {items.map((item, index) => (
        <View key={item.id} style={styles.field}>
          <Label muted>{item.date}</Label>
          <Input
            multiline
            accessibilityLabel={String(index + 1) + '번째 일정'}
            value={changes.get(item.id) ?? ''}
            onChangeText={(value) => change(item.id, value)}
          />
        </View>
      ))}
    </Dialog>
  );
}
