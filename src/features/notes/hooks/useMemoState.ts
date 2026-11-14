import { useRef, useState } from 'react';
import { report, showDialog } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import type { Memo } from '../../planner/types';
import { useMemoActions } from './useMemoActions';

export function useMemoState() {
  const data = usePlanner((state) => state.data.memos);
  const unavailable = usePlanner((state) => state.restoring || !state.ready);
  const error = usePlanner((state) => state.error);
  const memos = [...(data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [editing, setEditing] = useState<Memo | null | undefined>();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const operationBusy = useRef(false);
  const actions = useMemoActions();
  const disabled = busy || unavailable;

  function open(memo: Memo | null) {
    setEditing(memo);
    setContent(memo?.content ?? '');
  }

  async function run(action: () => Promise<void>) {
    const running = operationBusy.current;

    if (running) {
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

  async function save() {
    await actions.saveMemo(editing?.id ?? null, content);
    setEditing(undefined);
  }

  function requestDelete(memo: Memo) {
    showDialog('메모 삭제', '이 메모를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void run(async () => {
            await actions.deleteMemo(memo.id);
            setEditing(undefined);
          });
        },
      },
    ]);
  }

  return {
    memos,
    error,
    editing,
    content,
    busy,
    disabled,
    open,
    run,
    save,
    requestDelete,
    setEditing,
    setContent,
    actions,
  };
}
