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
        </Dialog>
      ) : null}
    </View>
  );
}
