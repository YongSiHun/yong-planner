import { deleteConfirmation } from '../services/confirmation';
import { useDialogStore, type DialogAction } from '../stores/dialog';

export function showDialog(
  title: string,
  message: string,
  actions: DialogAction[] = [{ text: '확인' }],
  options: { dismissOnPress?: boolean } = {},
): void {
  useDialogStore.setState({ request: { title, message, actions, ...options } });
}

export function showDeleteDialog(message: string, onConfirm: () => void): void {
  useDialogStore.setState({ request: deleteConfirmation(message, onConfirm) });
}

export function report(error: unknown): void {
  showDialog('확인해 주세요', error instanceof Error ? error.message : String(error));
}
