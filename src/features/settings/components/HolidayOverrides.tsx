import { buttonLabelSize } from '../../../components/ui/settings.styles';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, report, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { usePlanner } from '../../../stores/planner';
import { today } from '../../../utils/date';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import * as styles from './HolidayOverrides.styles';

export function HolidayOverrides() {
  const theme = useTheme();
  const { saveHolidayOverride, removeHolidayOverride } = usePlannerActions();
  const overrides = usePlanner((state) => state.data.holidayOverrides);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [name, setName] = useState('');

  function handleSave() {
    try {
      saveHolidayOverride(date, name);
      setEditorOpen(false);
      setName('');
    } catch (error) {
      report(error);
    }
  }

  return (
    <View style={styles.section}>
      <Label style={styles.holidayOverridesLabelStyle}>공휴일 보정</Label>
      <Label muted style={styles.description}>
        라이브러리에 없는 임시공휴일을 추가하거나 특정 날짜의 공휴일을 해제할 수 있습니다.
      </Label>

      {overrides.map((override) => (
        <View key={override.date} style={styles.row}>
          <Label style={styles.holidayOverridesLabelStyle2}>
            {override.date} · {override.name ?? '공휴일 해제'}
          </Label>
          <Button
            labelSize={buttonLabelSize}
            style={styles.button}
            title="삭제"
            onPress={() => removeHolidayOverride(override.date)}
          />
        </View>
      ))}

      <Button
        labelSize={buttonLabelSize}
        title="+ 공휴일 보정 추가"
        style={styles.addButton(theme)}
        onPress={() => setEditorOpen(true)}
      />

      {isEditorOpen ? (
        <Dialog
          title="공휴일 보정"
          onClose={() => setEditorOpen(false)}
          footer={
            <Button
              labelSize={buttonLabelSize}
              title="저장"
              bold
              style={styles.action}
              onPress={handleSave}
            />
          }
        >
          <HolidayDateInput date={date} onChange={setDate} />
          <Input
            accessibilityLabel="공휴일 이름"
            value={name}
            onChangeText={setName}
            placeholder="임시공휴일 이름 · 비우면 공휴일 해제"
          />
        </Dialog>
      ) : null}
    </View>
  );
}

function HolidayDateInput({ date, onChange }: { date: string; onChange(date: string): void }) {
  const parts = date.split('-');
  const fields = [
    { label: '연도', placeholder: 'YYYY', length: 4 },
    { label: '월', placeholder: 'MM', length: 2 },
    { label: '일', placeholder: 'DD', length: 2 },
  ];

  function changePart(index: number, value: string) {
    const next = [...parts];

    next[index] = value.replace(/\D/g, '').slice(0, fields[index]!.length);
    onChange(next.join('-'));
  }

  function padPart(index: number) {
    const value = parts[index]!;
    const hasValue = value.length > 0;

    if (hasValue) {
      changePart(index, value.padStart(fields[index]!.length, '0'));
    }
  }

  return (
    <View style={styles.dateRow}>
      {fields.map((field, index) => (
        <View key={field.label} style={index === 0 ? styles.yearField : styles.dateField}>
          <Label muted>{field.label}</Label>
          <Input
            accessibilityLabel={'보정 날짜 ' + field.label}
            value={parts[index]}
            onChangeText={(value) => changePart(index, value)}
            onBlur={() => padPart(index)}
            keyboardType="number-pad"
            maxLength={field.length}
            placeholder={field.placeholder}
          />
        </View>
      ))}
    </View>
  );
}
