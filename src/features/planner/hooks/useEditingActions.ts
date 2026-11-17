import { closePlannerEditor, editPlannerDate, finishPlannerDate } from '../controllers/editing';

const actions = { closePlannerEditor, editPlannerDate, finishPlannerDate };

export function useEditingActions() {
  return actions;
}
