import type { RecurringPlan } from '../planner/types';

export type CalendarField = 'startDate' | 'endDate';

export type ChangePlan = (patch: Partial<RecurringPlan>) => void;
