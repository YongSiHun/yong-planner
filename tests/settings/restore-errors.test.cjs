const { assert, beforeEach, test } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const hooks = createHookHarness();
const mock = createModuleMock(require);
const dialogs = [];
let chooseError, backup;
const raw = new Error('SQLITE_IOERR: /private/database.db');
mock('react', hooks.react);
mock('../../src/components/ui/index.tsx', {
  showDialog: (title, message, actions) => dialogs.push({ title, message, actions }),
  report: () => assert.fail('raw exception reached generic reporter'),
});
mock('../../src/features/settings/hooks/useBackupActions.ts', {
  useBackupActions: () => ({
    choose: async () => {
      if (chooseError) throw chooseError;
      return backup;
    },
    restore: async () => {
      throw raw;
    },
    backup: async () => {},
  }),
});
const { useBackupState } = require('../../src/features/settings/hooks/useBackupState.ts');
const render = () => hooks.render(useBackupState);
const settle = () => new Promise((resolve) => setImmediate(resolve));
beforeEach(() => {
  hooks.reset();
  dialogs.length = 0;
  chooseError = null;
  backup = null;
});

for (const kind of ['selection', 'notes', 'full']) {
  test(kind + ' restore failure hides native details and releases the busy lock', async () => {
    if (kind === 'selection') chooseError = raw;
    if (kind === 'notes') backup = { kind: 'notes' };
    if (kind === 'full') backup = { kind: 'full' };
    render().handleRestore();
    await settle();
    if (kind === 'full') {
      dialogs
        .at(-1)
        .actions.find((action) => action.style === 'destructive')
        .onPress();
      await settle();
    }
    const failure = dialogs.at(-1);
    assert.equal(failure.title, '복원 실패');
    assert.doesNotMatch(failure.message, /SQLITE|private|database/);
    assert.equal(render().isBusy, false);
  });
}
