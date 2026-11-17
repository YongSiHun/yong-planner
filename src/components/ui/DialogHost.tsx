import { useDialogStore, type DialogAction } from '../../stores/dialog';
import { ConfirmationDialog } from './ConfirmationDialog';

export function DialogHost() {
  const request = useDialogStore((state) => state.request);

  if (!request) {
    return null;
  }

  function choose(action?: DialogAction) {
    useDialogStore.setState({ request: null });
    action?.onPress?.();
  }

  return <ConfirmationDialog {...request} onChoose={choose} />;
}
