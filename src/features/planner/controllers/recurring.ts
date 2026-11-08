import { validateData } from '../../../services/backup';
import { type RecurringPlan, type RecurringPlanException } from '../types';
import { updatePlanner } from './persistence';

export function saveRecurring(plan: RecurringPlan): void {
  updatePlanner(
    (data) =>
      validateData({
        ...data,
        recurringPlans: [...data.recurringPlans.filter((item) => item.id !== plan.id), plan],
      }),
    true,
  );
}

export function deleteRecurring(id: string): void {
  updatePlanner(
    (data) => ({
      ...data,
      recurringPlans: data.recurringPlans.filter((plan) => plan.id !== id),
      recurringPlanExceptions: data.recurringPlanExceptions.filter(
        (item) => item.recurringPlanId !== id,
      ),
    }),
    true,
  );
}

export function saveException(
  id: string,
  date: string,
  value: RecurringPlanException | null,
): void {
  updatePlanner(
    (data) =>
      validateData({
        ...data,
        recurringPlanExceptions: [
          ...data.recurringPlanExceptions.filter(
            (item) => !(item.recurringPlanId === id && item.date === date),
          ),
          ...(value ? [value] : []),
        ],
      }),
    true,
  );
}
