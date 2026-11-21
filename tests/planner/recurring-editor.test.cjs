const { assert, test, beforeEach } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const hooks = createHookHarness();
const mock = createModuleMock(require);
const messages = [];
mock('react', hooks.react);
mock('react-native', { Keyboard: { dismiss() {} } });
mock('expo-router', { router: { push() {} } });
mock('../../src/components/ui/index.tsx', {
  report: (error) => messages.push(error.message),
  showToast() {},
});
mock('../../src/stores/planner.ts', {
  usePlanner: Object.assign((selector) => selector({ data: { settings: {} } }), {
    getState: () => ({ data: { recurringPlans: [], recurringPlanExceptions: [] } }),
  }),
});
mock('../../src/features/planner/hooks/usePlannerActions.ts', {
  usePlannerActions: () => ({ saveException() {} }),
});
const { useRecurringNote } = require('../../src/features/planner/hooks/useRecurringNote.ts');
beforeEach(() => {
  hooks.reset();
  messages.length = 0;
});

test('a stale recurring row reports a removed plan instead of dereferencing undefined', () => {
  const editor = hooks.render(() =>
    useRecurringNote(
      { sourceId: 'deleted', content: '회의', time: null, kind: 'recurring' },
      '2026-11-21',
    ),
  );
  assert.doesNotThrow(() => editor.startEditing());
  assert.match(messages[0], /삭제된 반복 일정/);
});
