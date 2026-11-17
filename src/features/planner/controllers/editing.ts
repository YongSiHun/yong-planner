import { usePlannerEditing } from '../../../stores/plannerEditing';

export function editPlannerDate(date: string) {
  usePlannerEditing.setState({ date });
}

export function finishPlannerDate(date: string) {
  const active = usePlannerEditing.getState().date === date;

  if (active) {
    closePlannerEditor();
  }
}

export function closePlannerEditor() {
  usePlannerEditing.setState({ date: null });
}
