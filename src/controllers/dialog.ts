import { useDialogStore, type DialogAction } from '../stores/dialog';

export function showDialog(
  title: string,
  message: string,
  actions: DialogAction[] = [{ text: '확인' }],
): void {
  useDialogStore.setState({ request: { title, message, actions } });
}
