import { choosePlannerBackup, restorePlannerBackup } from '../controllers/backup';

const actions = {
  choose: choosePlannerBackup,
  restore: restorePlannerBackup,
};

export function useBackupActions() {
  return actions;
}
