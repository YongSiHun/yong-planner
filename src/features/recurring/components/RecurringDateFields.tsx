import { View } from 'react-native';
import { Button, Label, styles as layoutStyles } from '../../../components/ui';
import type { RecurringPlan } from '../../planner/types';
import { type ChangePlan, type CalendarField } from '../types';

export function DateFields({
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
      <Button
        style={layoutStyles.textAction}
        title={plan.startDate + ' ▾'}
        onPress={() => onSelect('startDate')}
      />

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
