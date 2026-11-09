import { useRef, useState } from 'react';
import { report, showDialog } from '../../../components/ui';
import type { PlannerBackup } from '../../../services/backup';
import { useBackupActions } from './useBackupActions';
export function useBackupState() {
  const { backup, choose, restore } = useBackupActions();
  const [isBusy, setBusy] = useState(false);
  const operationBusy = useRef(false);

  async function runAction(action: () => Promise<void>) {
    const isRunning = operationBusy.current;

    if (isRunning) {
      return;
    }

    operationBusy.current = true;
    setBusy(true);

    try {
      await action();
    } catch (error) {
      report(error);
    } finally {
      operationBusy.current = false;
      setBusy(false);
    }
  }

  async function handleBackup() {
    await backup();
  }

  async function restoreBackup(data: PlannerBackup) {
    await restore(data);
    showDialog(
      '복원 완료',
      data.month ? data.month + ' 일정을 불러왔습니다.' : '백업의 일정을 모두 불러왔습니다.',
    );
  }

  async function handleRestore() {
    const backup = await choose();
    const hasBackup = backup !== null;

    if (!hasBackup) {
      return;
    }

    const monthly = backup.month !== undefined;

    showDialog(
      monthly ? backup.month + ' 일정 복원' : '전체 데이터 복원',
      monthly
        ? '해당 월의 일정을 백업 파일로 교체합니다. 다른 달의 일정과 현재 설정은 유지됩니다. 복원할까요?'
        : '현재 일정을 백업 파일의 데이터로 교체합니다. 먼저 JSON 백업을 보관하는 것을 권장합니다. 복원할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: monthly ? '해당 월 교체' : '전체 교체',
          style: 'destructive',
          onPress: () => {
            void runAction(() => restoreBackup(backup));
          },
        },
      ],
    );
  }

  return {
    isBusy,
    handleBackup: () => {
      void runAction(handleBackup);
    },
    handleRestore: () => {
      void runAction(handleRestore);
    },
  };
}
