import { View } from 'react-native';
import { Button, Label, styles as layoutStyles } from '../../../components/ui';
import { weekdays } from '../../../utils/date';
import type { RecurringPlan } from '../../planner/types';
import { toggleWeekday } from '../services/presentation';
import { type ChangePlan } from '../types';

const weekdayPresets = [
  { label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: '평일', days: [1, 2, 3, 4, 5] },
  { label: '주말', days: [0, 6] },
];

export function WeekdaySelector({ plan, onChange }: { plan: RecurringPlan; onChange: ChangePlan }) {
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
