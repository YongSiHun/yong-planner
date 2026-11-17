import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import type { MemoState } from '../types/presentation';

export function useMemoBack({
  editing,
  selecting,
  trashOpen,
  closeEditor,
  cancelSelection,
  closeTrash,
}: MemoState) {
  const editorOpen = editing !== undefined;
  const active = editorOpen || selecting || trashOpen;

  useEffect(() => {
    if (!active) {
      return;
    }
    const back = () => {
      handleNotesBack(editorOpen, selecting, closeEditor, cancelSelection, closeTrash);

      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', back);

    return () => subscription.remove();
  }, [active, editorOpen, selecting, closeEditor, cancelSelection, closeTrash]);
}

function handleNotesBack(
  editorOpen: boolean,
  selecting: boolean,
  closeEditor: () => void,
  cancelSelection: () => void,
  closeTrash: () => void,
) {
  if (editorOpen) {
    closeEditor();

    return;
  }
  if (selecting) {
    cancelSelection();

    return;
  }
  closeTrash();
}
