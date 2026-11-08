import { backupFile, chooseBackup } from '../../../services/export/files';
import { usePlanner } from '../../../stores/planner';
import { flushPlanner, restorePlanner } from '../../planner/controllers/planner';

export async function backupPlanner(): Promise<void> {
  await flushPlanner();
  await backupFile(usePlanner.getState().data);
}

export const choosePlannerBackup = chooseBackup;
export const restorePlannerBackup = restorePlanner;
