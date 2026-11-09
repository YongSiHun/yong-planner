import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { boundedClockInput, formatScheduleContent, timeFromFields } from '../services/time';
import type { DailyPlanItem, TimeFormat } from '../types';
import * as styles from './TimePicker.styles';

export function TimePicker({
  item,
  items = [item],
  format,
  count = 1,
  hasExistingTime,
  clearTitle = '시간 지우기',
  overwriteMessage,
  title = '시간 설정',
  onClose,
  onSave,
}: {
  item: DailyPlanItem;
  items?: readonly DailyPlanItem[];
  format: TimeFormat;
  count?: number;
  title?: string;
  hasExistingTime?: boolean;
  clearTitle?: string;
  overwriteMessage?: string;
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
  const hasTime = hasExistingTime ?? Boolean(item.time);

  return (
    <Dialog
      title={title}
      height={styles.dialogHeight}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <View style={styles.clearSlot}>
            {hasTime ? (
              <Button
                bold
                title={clearTitle}
                danger
                onPress={() => onSave(null)}
                style={styles.action}
              />
            ) : null}
          </View>
          <Button
            bold
            title={overwriteMessage ? '덮어쓰기' : '적용'}
            disabled={time === null}
            onPress={() => onSave(time)}
            style={styles.action}
          />
        </View>
      }
    >
      {renderOverwriteNotice(overwriteMessage)}
      <View style={styles.preview(theme)}>
        <Label muted>{count}개 일정에 적용</Label>
        <ScrollView
          accessibilityLabel="선택한 일정 목록"
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={styles.previewScroll}
          contentContainerStyle={styles.previewContent}
        >
          {items.map((entry) => (
            <Label key={entry.id}>{formatScheduleContent(entry.content, entry.time, format)}</Label>
          ))}
        </ScrollView>
      </View>
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
