import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import type { Theme } from '../../../components/ui/palette';
import { timeChangeClearsAlarm } from '../services/alarms';
import { boundedClockInput, formatSchedulePreview, timeFromFields } from '../services/time';
import type { DailyPlanItem, TimeFormat } from '../types';
import * as styles from './TimePicker.styles';

export function TimePicker({
  item,
  items = [item],
  format,
  count = 1,
  hasExistingTime,
  clearTitle = '시간 지우기',
  title = '시간 설정',
  alarmSetting = false,
  onClose,
  onSave,
}: {
  item: DailyPlanItem;
  items?: readonly DailyPlanItem[];
  format: TimeFormat;
  count?: number;
  title?: string;
  alarmSetting?: boolean;
  hasExistingTime?: boolean;
  clearTitle?: string;
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
      headerNotice={renderAlarmNotice(items, time, alarmSetting, theme)}
      scrollable={false}
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
            title="적용"
            disabled={time === null}
            onPress={() => onSave(time)}
            style={styles.action}
          />
        </View>
      }
    >
      <View style={styles.preview(theme)}>
        <Label muted>{count}개 일정에 적용</Label>
        <ScrollView
          accessibilityLabel="선택한 일정 목록"
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={styles.previewScroll}
          contentContainerStyle={styles.previewContent}
        >
          <Label>{formatSchedulePreview(items, format)}</Label>
        </ScrollView>
      </View>
      <View style={styles.timePickerViewStyle2}>
        {is12 ? (
          <View style={styles.timePickerViewStyle}>
            <Button
              compact
              style={styles.period}
              title="오전"
              selected={period === 'am'}
              onPress={() => setPeriod('am')}
            />
            <Button
              compact
              style={styles.period}
              title="오후"
              selected={period === 'pm'}
              onPress={() => setPeriod('pm')}
            />
          </View>
        ) : null}
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

function renderAlarmNotice(
  items: readonly DailyPlanItem[],
  time: string | null,
  alarmSetting: boolean,
  theme: Theme,
) {
  if (alarmSetting) {
    return <Label style={styles.alarmNotice(theme)}>설정한 시간으로 알람이 일괄로 설정돼요</Label>;
  }
  const visible = time !== null && items.some((item) => timeChangeClearsAlarm(item, time));

  return visible ? (
    <Label style={styles.alarmNotice(theme)}>알람이 설정된 일정은 알람이 해제돼요</Label>
  ) : null;
}
