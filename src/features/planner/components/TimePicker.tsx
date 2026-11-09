import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { boundedClockInput, formatScheduleContent, timeFromFields } from '../services/time';
import type { DailyPlanItem, TimeFormat } from '../types';
import * as styles from './TimePicker.styles';

export function TimePicker({
  item,
  format,
  count = 1,
  hasExistingTime,
  overwriteMessage,
  title = '시간 설정',
  onClose,
  onSave,
}: {
  item: DailyPlanItem;
  format: TimeFormat;
  count?: number;
  title?: string;
  hasExistingTime?: boolean;
  overwriteMessage?: string;
  onClose(): void;
  onSave(time: string | null): void;
}) {
  const [hour, setHour] = useState(() => initialHour(item.time, format));
  const [minute, setMinute] = useState(item.time?.slice(3) ?? '00');
  const [period, setPeriod] = useState<'am' | 'pm'>(() =>
    Number(item.time?.slice(0, 2) ?? 9) >= 12 ? 'pm' : 'am',
  );
  const time = timeFromFields(hour, minute, period, format);
  const is12 = format === '12h';
  const hasTime = hasExistingTime ?? Boolean(item.time);

  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <Button
          bold
          title={overwriteMessage ? '덮어쓰기' : '적용'}
          disabled={time === null}
          onPress={() => onSave(time)}
          style={styles.action}
        />
      }
    >
      {renderOverwriteNotice(overwriteMessage)}
      <Label>
        {count > 1 ? count + '개 일정에 적용' : formatScheduleContent(item.content, time, format)}
      </Label>
      {is12 ? (
        <View style={styles.timePickerViewStyle}>
          <Button title="오전" selected={period === 'am'} onPress={() => setPeriod('am')} />
          <Button title="오후" selected={period === 'pm'} onPress={() => setPeriod('pm')} />
        </View>
      ) : null}
      <View style={styles.timePickerViewStyle2}>
        <View style={styles.timePickerViewStyle3}>
          <Input
            accessibilityLabel="시"
            value={hour}
            onChangeText={(value) =>
              setHour(boundedClockInput(value, hour, is12 ? 1 : 0, is12 ? 12 : 23))
            }
            keyboardType="number-pad"
            style={styles.timePickerInputStyle}
          />
        </View>
        <Label>시</Label>
        <View style={styles.timePickerViewStyle3}>
          <Input
            accessibilityLabel="분"
            value={minute}
            onChangeText={(value) => setMinute(boundedClockInput(value, minute, 0, 59))}
            keyboardType="number-pad"
            style={styles.timePickerInputStyle}
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

function renderOverwriteNotice(message: string | undefined) {
  const visible = message !== undefined;

  return visible ? <Label>{message}</Label> : null;
}
