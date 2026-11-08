import { useRef, useState } from 'react';
import { report, showDialog } from '../../../components/ui';
import type { PlannerData } from '../../planner/types';
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

  async function restoreBackup(data: PlannerData) {
    await restore(data);
    showDialog('복원 완료', '백업의 일정을 모두 불러왔습니다.');
  }

  async function handleRestore() {
    const backup = await choose();
    const hasBackup = backup !== null;

    if (!hasBackup) {
      return;
    }

    showDialog(
      '전체 데이터 복원',
      '현재 일정을 백업 파일의 데이터로 교체합니다. 먼저 JSON 백업을 보관하는 것을 권장합니다. 복원할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 교체',
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
