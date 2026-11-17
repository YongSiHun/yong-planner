import { usePlannerEditing } from '../../../stores/plannerEditing';
import { useEditingActions } from '../hooks/useEditingActions';
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
}: Omit<DayProps, ModelKeys | 'isEditing' | 'onEdit' | 'onFinish'> & { holidays: HolidayService }) {
  const selectDay = useMemo(() => createDaySelector(props.date, holidays), [props.date, holidays]);
  const day = usePlanner((state) => selectDay(state.data));

  const isEditing = usePlannerEditing((state) => state.date === props.date);
  const { editPlannerDate, finishPlannerDate } = useEditingActions();

  return (
    <DayRow
      {...props}
      {...day}
      isEditing={isEditing}
      onEdit={editPlannerDate}
      onFinish={finishPlannerDate}
    />
  );
});
