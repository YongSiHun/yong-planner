import { useState } from 'react';
import { showDialog, showDeleteDialog } from '../../../components/ui';
import { memoFields } from '../services/memo';
import { memoInputError, memoLengthError, memoLimitNotice } from '../services/validation';
import type { Memo } from '../../planner/types';
import type { MemoOperation } from '../types/presentation';
import { useMemoActions } from './useMemoActions';

export function useMemoEditor({ disabled, isRunning, run }: MemoOperation) {
  const actions = useMemoActions();
  const [editing, setEditing] = useState<Memo | null | undefined>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);

  function open(memo: Memo | null) {
    if (disabled) {
      return;
    }
    const fields = memoFields(memo);

    setEditing(memo);
    setTitle(fields.title);
    setContent(fields.body);
  }

  function resetEditor() {
    setEditing(undefined);
    setTitle('');
    setContent('');
    setEditorMenuOpen(false);
  }

  function closeEditor() {
    const running = isRunning();

    if (running) {
      return;
    }
    const original = memoFields(editing);
    const unchanged = title === original.title && content === original.body;
    const canClose = editing?.deletedAt !== undefined || unchanged;

    if (canClose) {
      resetEditor();

      return;
    }
    showDialog('메모 닫기', '저장하지 않은 내용을 버릴까요?', [
      { text: '계속 작성', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: resetEditor },
    ]);
  }

  async function save() {
    const trashed = editing?.deletedAt !== undefined;

    if (trashed) {
      return;
    }
    await run(async () => {
      await actions.saveMemo(editing?.id ?? null, content, title);
      resetEditor();
    });
  }

  function requestEditorDelete() {
    const cannotDelete = disabled || editing === undefined;

    if (cannotDelete) {
      return;
    }
    const id = editing?.id;
    const message = id
      ? '선택한 메모 1개를 휴지통으로 이동합니다. 30일 동안 복구할 수 있어요.'
      : '작성 중인 메모 1개를 삭제합니다.';

    setEditorMenuOpen(false);
    showDeleteDialog(message, () => {
      void run(async () => {
        await deleteEditingMemo(id);
        resetEditor();
      });
    });
  }

  async function deleteEditingMemo(id: string | undefined) {
    const saved = id !== undefined;

    if (saved) {
      await actions.deleteMemos(new Set([id]));
    }
  }

  function openEditorMenu() {
    if (disabled) {
      return;
    }
    setEditorMenuOpen(true);
  }

  return {
    editing,
    title,
    content,
    editorMenuOpen,
    open,
    closeEditor,
    save,
    resetEditor,
    setTitle,
    setContent,
    openEditorMenu,
    closeEditorMenu: () => setEditorMenuOpen(false),
    requestEditorDelete,
    validationError: memoInputError(content, title),
    lengthError: memoLengthError(content, title),
    limitNotice: memoLimitNotice(content, title),
  };
}
