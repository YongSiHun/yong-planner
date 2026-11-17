import { Button, design } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import type { MemoState } from '../types/presentation';
import * as styles from './MemoListMenu.styles';

export function MemoListMenu({ state }: { state: MemoState }) {
  const visible = state.listMenuOpen;

  if (!visible) {
    return null;
  }

  return (
    <Dialog
      title="메모 메뉴"
      showHeader={false}
      maxWidth={design.layout.menuMaxWidth}
      paddingVertical={design.space.md}
      onClose={state.closeListMenu}
    >
      <Button
        title="휴지통"
        bold
        labelSize={design.type.action}
        style={styles.menuItem}
        disabled={state.disabled}
        onPress={state.openTrash}
      />
    </Dialog>
  );
}
