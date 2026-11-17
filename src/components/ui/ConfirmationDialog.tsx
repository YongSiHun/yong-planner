import { View } from 'react-native';
import type { DialogAction } from '../../stores/dialog';
import { Dialog } from './Dialog';
import { Button, Label, design } from './index';
import * as styles from './Dialog.styles';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  actions: readonly DialogAction[];
  onChoose(action?: DialogAction): void;
  dismissOnPress?: boolean;
}

export function ConfirmationDialog({
  title,
  message,
  actions,
  onChoose,
  dismissOnPress,
}: ConfirmationDialogProps) {
  const cancel = actions.find((action) => action.style === 'cancel');

  return (
    <Dialog
      title={title}
      titleSize={design.type.title}
      dismissOnPress={dismissOnPress}
      onClose={() => onChoose(cancel)}
      footer={
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Button
              key={index}
              title={action.text}
              labelSize={design.type.body}
              bold
              danger={action.style === 'destructive'}
              onPress={() => onChoose(action)}
              style={styles.action}
            />
          ))}
        </View>
      }
    >
      <Label>{message}</Label>
    </Dialog>
  );
}
