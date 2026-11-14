import { useRef, useState } from 'react';
import { report, showDialog } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import type { Memo } from '../../planner/types';
import { memoFields } from '../services/memo';
import { memoInputError, memoLengthError, memoLimitNotice } from '../services/validation';
import { useMemoActions } from './useMemoActions';

export function useMemoState() {
  const data = usePlanner((state) => state.data.memos);
  const unavailable = usePlanner((state) => state.restoring || !state.ready);
  const error = usePlanner((state) => state.error);
  const memos = [...(data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [editing, setEditing] = useState<Memo | null | undefined>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selected = new Set(memos.filter((memo) => selectedIds.has(memo.id)).map((memo) => memo.id));
  const operationBusy = useRef(false);
  const actions = useMemoActions();
  const disabled = busy || unavailable;

  function open(memo: Memo | null) {
    if (disabled) {
      return;
    }
    const fields = memoFields(memo);

    setEditing(memo);
    setTitle(fields.title);
    setContent(fields.body);
  }

  function closeEditor() {
    const running = operationBusy.current;

    if (running) {
      return;
    }
    const original = memoFields(editing);
    const unchanged = title === original.title && content === original.body;

    if (unchanged) {
      setEditing(undefined);

      return;
    }
    showDialog('메모 닫기', '저장하지 않은 내용을 버릴까요?', [
      { text: '계속 작성', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: () => setEditing(undefined) },
    ]);
  }

  function cancelSelection() {
    const running = operationBusy.current;

    if (running) {
      return;
    }
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function toggleSelection(id: string) {
    if (disabled) {
      return;
    }
    setSelecting(true);
    setSelectedIds((current) => toggleId(current, id));
  }

  function selectAll() {
    if (disabled) {
      return;
    }
    setSelectedIds(
      selected.size === memos.length ? new Set() : new Set(memos.map((memo) => memo.id)),
    );
  }

  async function run(action: () => Promise<void>) {
    const cannotRun = operationBusy.current || unavailable;

    if (cannotRun) {
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
    await actions.saveMemo(editing?.id ?? null, content, title);
    setEditing(undefined);
  }

  function requestDelete() {
    const cannotDelete = disabled || selected.size === 0;

    if (cannotDelete) {
      return;
    }
    const ids = new Set(selected);

    showDialog('메모 삭제', `선택한 메모 ${ids.size}개를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void run(async () => {
            await actions.deleteMemos(ids);
            setSelecting(false);
            setSelectedIds(new Set());
          });
        },
      },
    ]);
  }

  function openEditorMenu() {
    if (disabled) {
      return;
    }
    setEditorMenuOpen(true);
  }

  function requestEditorDelete() {
    const cannotDelete = disabled || editing === undefined;

    if (cannotDelete) {
      return;
    }
    const id = editing?.id;
    const message = id ? '이 메모를 삭제할까요?' : '작성 중인 메모를 삭제할까요?';

    setEditorMenuOpen(false);
    showDialog('메모 삭제', message, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void run(async () => {
            await deleteEditingMemo(id);
          });
        },
      },
    ]);
  }

  async function deleteEditingMemo(id: string | undefined) {
    const saved = id !== undefined;

    if (saved) {
      await actions.deleteMemos(new Set([id]));
    }
    setEditing(undefined);
    setTitle('');
    setContent('');
  }

  function startSelection() {
    if (disabled) {
      return;
    }
    setSelecting(true);
  }

  return {
    validationError: memoInputError(content, title),
    lengthError: memoLengthError(content, title),
    limitNotice: memoLimitNotice(content, title),
    editorMenuOpen,
    openEditorMenu,
    closeEditorMenu: () => setEditorMenuOpen(false),
    requestEditorDelete,
    memos,
    error,
    editing,
    title,
    content,
    busy,
    disabled,
    selecting,
    selected,
    open,
    closeEditor,
    run,
    save,
    requestDelete,
    setTitle,
    setContent,
    actions,
    startSelection,
    cancelSelection,
    toggleSelection,
    selectAll,
  };
}

function toggleId(current: Set<string>, id: string) {
  const next = new Set(current);
  const alreadySelected = next.has(id);

  if (alreadySelected) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
}
