import { useRef, useState } from 'react';
import { report, showDialog } from '../../../components/ui';
import type { PlannerBackup } from '../../../services/backup';
import { useBackupActions } from './useBackupActions';
export function useBackupState() {
  const { choose, restore, backup: backupAll } = useBackupActions();
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

  async function restoreBackup(data: PlannerBackup) {
    await restore(data);
    showDialog(
      '복원 완료',
      data.kind === 'notes' ? '메모를 불러왔습니다.' : '백업 데이터를 불러왔습니다.',
    );
  }

  async function handleRestore() {
    const backup = await choose();
    const hasBackup = backup !== null;

    if (!hasBackup) {
      return;
    }

    const notes = backup.kind === 'notes';

    if (notes) {
      await restoreBackup(backup);

      return;
    }

    confirmRestore(backup);
  }

  function confirmRestore(backup: PlannerBackup) {
    const monthly = backup.month !== undefined;

    showDialog(
      monthly ? backup.month + ' 일정 복원' : '전체 데이터 복원',
      monthly
        ? '해당 월의 일정을 백업 파일로 교체합니다. 다른 달의 일정과 현재 설정은 유지됩니다. 복원할까요?'
        : '현재의 모든 일정·메모·설정을 덮어씁니다. 이 작업은 되돌릴 수 없으므로 먼저 전체 백업을 보관하세요. 복원할까요?',
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
    handleBackup: () =>
      showDialog(
        '전체 데이터 백업',
        '일정이 있는 모든 달과 메모·설정을 하나의 JSON으로 모아 ZIP 파일로 저장합니다. 데이터가 많으면 시간이 오래 걸릴 수 있습니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '백업 시작',
            onPress: () => {
              void runAction(backupAll);
            },
          },
        ],
      ),
    handleRestore: () => {
      void runAction(handleRestore);
    },
  };
}
