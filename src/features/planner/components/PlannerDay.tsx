import { memo, useMemo } from 'react';
import type { HolidayService } from '../../../services/holiday';
import { usePlanner } from '../../../stores/planner';
import { createDaySelector } from '../services/day';
import type { DayRowProps } from '../types/presentation';
import { DayRow } from './DayRow';

type DayProps = DayRowProps;
type ModelKeys = 'note' | 'noteIds' | 'noteTimes' | 'recurring' | 'exceptions' | 'holidayName';

export const PlannerDay = memo(function PlannerDay({
  holidays,
  ...props
}: Omit<DayProps, ModelKeys> & { holidays: HolidayService }) {
  const selectDay = useMemo(() => createDaySelector(props.date, holidays), [props.date, holidays]);
  const day = usePlanner((state) => selectDay(state.data));

  return <DayRow {...props} {...day} />;
});
