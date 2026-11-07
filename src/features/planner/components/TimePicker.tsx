import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import type { DailyPlanItem, TimeFormat } from '../types';
import { formatScheduleContent, timeFromFields } from '../services/time';

export function TimePicker({
  item,
  format,
  onClose,
  onSave,
}: {
  item: DailyPlanItem;
  format: TimeFormat;
  onClose(): void;
  onSave(time: string | null): void;
}) {
  const theme = useTheme();
  const [hour, setHour] = useState(() => initialHour(item.time, format));
  const [minute, setMinute] = useState(item.time?.slice(3) ?? '00');
  const [period, setPeriod] = useState<'am' | 'pm'>(() =>
    Number(item.time?.slice(0, 2) ?? 9) >= 12 ? 'pm' : 'am',
  );
  const time = timeFromFields(hour, minute, period, format);
  const is12 = format === '12h';
  const hasTime = Boolean(item.time);

  return (
    <Dialog
      title="시간 설정"
      onClose={onClose}
      footer={
        <Button
          bold
          title="적용"
          disabled={time === null}
          onPress={() => onSave(time)}
          textColor={theme.onAccent}
          style={{ backgroundColor: theme.accent }}
        />
      }
    >
      <Label>{formatScheduleContent(item.content, time, format)}</Label>
      {is12 ? (
        <View style={{ flexDirection: 'row' }}>
          <Button title="오전" selected={period === 'am'} onPress={() => setPeriod('am')} />
          <Button title="오후" selected={period === 'pm'} onPress={() => setPeriod('pm')} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input
            accessibilityLabel="시"
            value={hour}
            onChangeText={(value) => setHour(value.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            style={{ textAlign: 'center' }}
          />
        </View>
        <Label>시</Label>
        <View style={{ flex: 1 }}>
          <Input
            accessibilityLabel="분"
            value={minute}
            onChangeText={(value) => setMinute(value.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            style={{ textAlign: 'center' }}
          />
        </View>
        <Label>분</Label>
      </View>
      {hasTime ? <Button compact title="시간 지우기" danger onPress={() => onSave(null)} /> : null}
    </Dialog>
  );
}

function initialHour(time: string | null | undefined, format: TimeFormat): string {
  const hour = Number(time?.slice(0, 2) ?? 9);

  return String(format === '12h' ? hour % 12 || 12 : hour);
}
