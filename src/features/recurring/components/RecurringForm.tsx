import { useState, type ComponentRef } from 'react';
import { View, type TextInput } from 'react-native';
import {
  Button,
  Input,
  Label,
  styles as layoutStyles,
  report,
  showDialog,
  useTheme,
} from '../../../components/ui';
import { weekdays } from '../../../utils/date';
import { Calendar } from '../../planner/components/Calendar';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import type { RecurringPlan } from '../../planner/types';
import { toggleWeekday } from '../services/presentation';
import * as styles from './RecurringForm.styles';

const holidayPolicies = [
  { value: 'include', label: '관계없음' },
  { value: 'exclude', label: '공휴일 제외' },
  { value: 'only', label: '공휴일만' },
] as const;
const weekdayPresets = [
  { label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: '평일', days: [1, 2, 3, 4, 5] },
  { label: '주말', days: [0, 6] },
];

type CalendarField = 'startDate' | 'endDate';
type ChangePlan = (patch: Partial<RecurringPlan>) => void;

function WeekdaySelector({ plan, onChange }: { plan: RecurringPlan; onChange: ChangePlan }) {
  const usesHolidaysOnly = plan.holidayPolicy === 'only';

  if (usesHolidaysOnly) {
    return <Label muted>요일과 관계없이 대한민국 공휴일에 반복합니다.</Label>;
  }

  return (
    <>
      <Label>반복 요일</Label>
      <View style={layoutStyles.row}>
        {weekdayPresets.map((preset) => (
          <Button
            key={preset.label}
            title={preset.label}
            onPress={() => onChange({ weekdays: preset.days })}
          />
        ))}
      </View>

      <View style={layoutStyles.row}>
        {weekdays.map((label, day) => (
          <Button
            key={day}
            title={label}
            selected={plan.weekdays.includes(day)}
            onPress={() => onChange({ weekdays: toggleWeekday(plan.weekdays, day) })}
          />
        ))}
      </View>
    </>
  );
}

function DateFields({
  plan,
  onChange,
  onSelect,
}: {
  plan: RecurringPlan;
  onChange: ChangePlan;
  onSelect(field: CalendarField): void;
}) {
  const hasEndDate = plan.endDate !== null;
  const endDateTitle = hasEndDate ? plan.endDate + ' ▾' : '종료일 선택';

  return (
    <>
      <Label>시작일</Label>
      <Button title={plan.startDate + ' ▾'} onPress={() => onSelect('startDate')} />

      <Label>종료일 · 해당 날짜 포함</Label>
      <View style={layoutStyles.row}>
        <Button title={endDateTitle} onPress={() => onSelect('endDate')} />
        <Button
          title="종료일 없음"
          selected={!hasEndDate}
          onPress={() => onChange({ endDate: null })}
        />
      </View>
    </>
  );
}

export function RecurringForm({
  initial,
  onClose,
  onInputFocus,
  onInputLayout,
}: {
  initial: RecurringPlan;
  onClose(): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}) {
  const theme = useTheme();
  const { saveRecurring, flush } = usePlannerActions();
  const [draft, setDraft] = useState(initial);
  const [calendar, setCalendar] = useState<CalendarField | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const hasExistingTitle = initial.title.length > 0;
  const title = hasExistingTitle ? '반복 일정 수정' : '반복 일정 추가';
  const calendarTitle = calendar === 'startDate' ? '시작일 선택' : '종료일 선택';

  function handleChange(patch: Partial<RecurringPlan>) {
    setHasChanges(true);
    setDraft((previous) => ({ ...previous, ...patch }));
  }

  function handleClose() {
    if (!hasChanges) {
      onClose();

      return;
    }

    showDialog('변경 내용 닫기', '아직 저장하지 않은 변경 내용을 버릴까요?', [
      { text: '계속 편집', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: onClose },
    ]);
  }

  async function handleSave() {
    try {
      saveRecurring(draft);
      await flush();
      onClose();
    } catch (error) {
      report(error);
    }
  }

  function handleDateSelect(date: string) {
    const hasCalendarField = calendar !== null;

    if (!hasCalendarField) {
      return;
    }

    handleChange({ [calendar]: date });
    setCalendar(null);
  }

  return (
    <View style={styles.recurringFormViewStyle}>
      <View style={layoutStyles.row}>
        <Label style={styles.recurringFormLabelStyle(theme)}>{title}</Label>
        <Button compact title="닫기" onPress={handleClose} />
      </View>
      <Label>일정 이름</Label>
      <Input
        onInputFocus={onInputFocus}
        onContentSizeChange={onInputLayout}
        onSelectionChange={onInputLayout}
        accessibilityLabel="반복 일정 이름"
        multiline
        value={draft.title}
        onChangeText={(title) => handleChange({ title })}
        placeholder="예: 통근 버스"
      />

      <Label>시간 · 선택 사항</Label>
      <Input
        onInputFocus={onInputFocus}
        onSelectionChange={onInputLayout}
        accessibilityLabel="반복 시간"
        value={draft.time ?? ''}
        onChangeText={(time) => handleChange({ time: time || null })}
        placeholder="08:30 · 비우면 시간 없음"
        autoCapitalize="none"
      />

      <Label>공휴일</Label>
      <View style={layoutStyles.row}>
        {holidayPolicies.map((policy) => (
          <Button
            key={policy.value}
            title={policy.label}
            selected={draft.holidayPolicy === policy.value}
            onPress={() => handleChange({ holidayPolicy: policy.value })}
          />
        ))}
      </View>

      <WeekdaySelector plan={draft} onChange={handleChange} />
      <DateFields plan={draft} onChange={handleChange} onSelect={setCalendar} />
      <Button
        title="저장"
        selected
        onPress={() => {
          void handleSave();
        }}
      />

      <Label muted>
        규칙을 변경해도 날짜별 예외는 유지됩니다. 변경된 규칙에 해당하는 날짜에서만 적용됩니다.
      </Label>

      {calendar ? (
        <View style={styles.recurringFormViewStyle2}>
          <View style={layoutStyles.row}>
            <Label style={styles.calendarTitle}>{calendarTitle}</Label>
            <Button compact title="날짜 선택 닫기" onPress={() => setCalendar(null)} />
          </View>
          <Calendar selected={draft[calendar] ?? draft.startDate} onSelect={handleDateSelect} />
        </View>
      ) : null}
    </View>
  );
}
