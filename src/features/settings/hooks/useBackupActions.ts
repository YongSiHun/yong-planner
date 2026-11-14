import {
  choosePlannerBackup,
  restorePlannerBackup,
  backupAllPlannerData,
} from '../controllers/backup';

const actions = {
  backup: backupAllPlannerData,
  choose: choosePlannerBackup,
  restore: restorePlannerBackup,
};

export function useBackupActions() {
  return actions;
}
