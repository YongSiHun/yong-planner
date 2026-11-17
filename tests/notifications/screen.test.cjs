const { assert, test, beforeEach } = require('../support/test.cjs');
const { find } = require('../support/tree.cjs');
const { createModuleMock } = require('../support/mock-module.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const hooks = createHookHarness();
let state;
const mock = createModuleMock(require);
mock('react', hooks.react);
mock('react-native', {
  ScrollView: 'ScrollView',
  View: 'View',
  Switch: 'Switch',
  StyleSheet: { create: (value) => value },
});
mock('react-native-safe-area-context', { SafeAreaView: 'SafeAreaView' });
const theme = require('../../src/components/ui/palette.ts').light;
mock('../../src/components/ui/index.tsx', {
  Button: 'Button',
  Label: 'Label',
  useTheme: () => theme,
  styles: {},
});
mock('../../src/features/notifications/hooks/useNotificationSettings.ts', {
  useNotificationSettings: () => state,
});
mock('../../src/stores/planner.ts', {
  usePlanner: (selector) => selector({ ready: true, restoring: false }),
});
mock('../../src/features/settings/hooks/useAlarmSettings.ts', {
  useAlarmSettings: () => ({ busy: false, requestDelete() {} }),
});
const Screen = require('../../src/features/notifications/screens/NotificationsScreen.tsx').default;

function preference(title) {
  return find(
    Screen(),
    (node) => node.type?.name === 'PreferenceSwitch' && node.props.title === title,
  );
}
function renderSwitch(title = '상태바에 표시') {
  return hooks.render(() => {
    const element = preference(title);
    return find(element.type(element.props), (node) => node.type?.name === 'Toggle');
  });
}
beforeEach(() => {
  hooks.reset();
  state = {
    ready: true,
    busy: false,
    preferences: { summary: false, lockScreen: false },
    permission: null,
    error: null,
    change: async () => {},
    retry() {},
    openSettings() {},
  };
});
test('a pending save reflects the tapped value immediately without disabling the status bar switch', async () => {
  let finish;
  state.change = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  renderSwitch().props.onValueChange(true);
  state.busy = true;
  assert.equal(renderSwitch().props.value, true);
  assert.equal(preference('상태바에 표시').props.disabled, false);
  assert.equal(preference('잠금 화면에 표시'), undefined);
  state.preferences.summary = true;
  finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(renderSwitch().props.value, true);
});
test('an unsaved preference returns to its persisted value after the action reports failure', async () => {
  let finish;
  state.change = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  renderSwitch().props.onValueChange(true);
  assert.equal(renderSwitch().props.value, true);
  finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(renderSwitch().props.value, false);
});
test('toggle remains enabled and accessible after a value change', async () => {
  const toggle = renderSwitch();
  assert.equal(toggle.props.accessibilityLabel, '상태바에 표시');
  toggle.props.onValueChange(true);
  assert.equal(renderSwitch().props.disabled, false);
  assert.equal(renderSwitch().props.value, true);
  await new Promise((resolve) => setImmediate(resolve));
});
