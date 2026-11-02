import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, Sheet, report, styles } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import { parseDate, today } from '../../../utils/date';

export function HolidayOverrides() {
  const overrides = usePlanner((state) => state.data.holidayOverrides);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [name, setName] = useState('');

  function handleRemove(removedDate: string) {
    usePlanner.getState().update(
      (data) => ({
        ...data,
        holidayOverrides: data.holidayOverrides.filter((override) => override.date !== removedDate),
      }),
      true,
    );
  }

  function handleSave() {
    try {
      parseDate(date);

      const hasBlankName = name.length > 0 && name.trim().length === 0;

      if (hasBlankName) {
        throw new Error('공휴일 이름을 확인해 주세요.');
      }

      usePlanner.getState().update(
        (data) => ({
          ...data,
          holidayOverrides: [
            ...data.holidayOverrides.filter((override) => override.date !== date),
            { date, name: name || null },
          ],
        }),
        true,
      );
      setEditorOpen(false);
      setName('');
    } catch (error) {
      report(error);
    }
  }

  return (
    <>
      <Label style={{ fontWeight: '700' }}>공휴일 보정</Label>
      <Label muted>
        라이브러리에 없는 임시공휴일을 추가하거나 특정 날짜의 공휴일을 해제할 수 있습니다.
      </Label>

      {overrides.map((override) => (
        <View key={override.date} style={styles.row}>
          <Label style={{ flex: 1 }}>
            {override.date} · {override.name ?? '공휴일 해제'}
          </Label>
          <Button title="삭제" onPress={() => handleRemove(override.date)} />
        </View>
      ))}

      <Button title="+ 공휴일 보정 추가" onPress={() => setEditorOpen(true)} />

      {isEditorOpen ? (
        <Sheet title="공휴일 보정" onClose={() => setEditorOpen(false)} scroll>
          <Input
            accessibilityLabel="보정 날짜"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <Input
            accessibilityLabel="공휴일 이름"
            value={name}
            onChangeText={setName}
            placeholder="임시공휴일 이름 · 비우면 공휴일 해제"
          />
          <Button title="저장" selected onPress={handleSave} />
        </Sheet>
      ) : null}
    </>
  );
}
