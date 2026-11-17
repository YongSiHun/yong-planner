const { assert, beforeEach, test } = require('../support/test.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const { find, expand } = require('../support/tree.cjs');
const mock = createModuleMock(require);
mock('react-native', { View: 'View' });
mock('../../src/components/ui/Dialog.tsx', { Dialog: 'Dialog' });
const { design } = require('../../src/components/ui/tokens.ts');
const { light, dark } = require('../../src/components/ui/palette.ts');
mock('../../src/components/ui/index.tsx', { Button: 'Button', Label: 'Label', design });
let request;
const useDialogStore = (select) => select({ request });
useDialogStore.setState = (patch) => {
  request = patch.request;
};
mock('../../src/stores/dialog.ts', { useDialogStore });
const { DialogHost } = require('../../src/components/ui/DialogHost.tsx');
const { DeleteSchedules } = require('../../src/features/planner/components/DeleteSchedules.tsx');
const { showDeleteDialog } = require('../../src/controllers/dialog.ts');
const { buttonLabel } = require('../../src/components/ui/Button.styles.ts');
const { dialogViewStyle } = require('../../src/components/ui/Dialog.styles.ts');
beforeEach(() => {
  request = null;
});

for (const theme of [light, dark]) {
  test(
    'delete confirmation uses the shared geometry, typography and danger colors in ' +
      (theme === light ? 'light' : 'dark') +
      ' mode',
    () => {
      const frame = dialogViewStyle(theme);
      assert.equal(frame.padding, 16);
      assert.equal(frame.borderRadius, 20);
      assert.equal(frame.maxWidth, 448);
      assert.equal(frame.gap, 12);
      const tree = expand(DeleteSchedules({ count: 3, onConfirm() {}, onCancel() {} }));
      assert.equal(tree.props.title, '삭제하시겠습니까?');
      assert.equal(tree.props.titleSize, 18);
      assert.ok(find(tree, (node) => node.props?.children === '선택한 일정 3개를 삭제합니다.'));
      const actions = tree.props.footer.props.children;
      for (const [index, action] of actions.entries()) {
        assert.equal(action.props.labelSize, 15);
        assert.equal(action.props.bold, true);
        assert.equal(action.props.style.minHeight, 44);
        assert.equal(action.props.style.paddingHorizontal, 0);
        assert.equal(action.props.style.paddingVertical, 8);
        assert.equal(action.props.style.backgroundColor, 'transparent');
        const label = buttonLabel(
          undefined,
          action.props.danger,
          theme,
          action.props.labelSize,
          false,
          action.props.bold,
        );
        assert.equal(label.color, index === 0 ? theme.accent : theme.red);
        assert.equal(label.fontFamily, design.font.bold);
      }
      assert.equal(tree.props.footer.props.style.columnGap, 16);
    },
  );
}

test('cancel and backdrop dismiss preserve data; confirmation closes before running deletion', () => {
  let deleted = 0,
    canceled = 0;
  const props = { count: 2, onConfirm: () => deleted++, onCancel: () => canceled++ };
  const dialog = expand(DeleteSchedules(props));
  dialog.props.onClose();
  assert.equal(canceled, 1);
  assert.equal(deleted, 0);
  showDeleteDialog('선택한 메모 2개를 휴지통으로 이동합니다. 30일 동안 복구할 수 있어요.', () => {
    assert.equal(request, null);
    deleted++;
  });
  const host = expand(DialogHost());
  host.props.onClose();
  assert.equal(deleted, 0);
  showDeleteDialog('메모 2개', () => {
    assert.equal(request, null);
    deleted++;
  });
  const confirmed = expand(DialogHost());
  confirmed.props.footer.props.children[1].props.onPress();
  assert.equal(deleted, 1);
});
