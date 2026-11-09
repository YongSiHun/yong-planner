import { View } from 'react-native';
import { useDialogStore, type DialogAction } from '../../stores/dialog';
import { Dialog } from './Dialog';
import * as styles from './Dialog.styles';
import { Button, Label } from './index';

export function DialogHost() {
  const request = useDialogStore((state) => state.request);

  if (!request) {
    return null;
  }

  function choose(action?: DialogAction) {
    useDialogStore.setState({ request: null });
    action?.onPress?.();
  }

  return (
    <Dialog
      title={request.title}
      dismissOnPress={request.dismissOnPress}
      onClose={() => choose(request.actions.find((action) => action.style === 'cancel'))}
      footer={
        <View style={styles.actions}>
          {request.actions.map((action, index) => (
            <Button
              key={index}
              title={action.text}
              bold
              danger={action.style === 'destructive'}
              onPress={() => choose(action)}
              style={styles.action}
            />
          ))}
        </View>
      }
    >
      <Label>{request.message}</Label>
    </Dialog>
  );
}
