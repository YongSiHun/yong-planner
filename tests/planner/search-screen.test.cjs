const { assert, test, beforeEach } = require('../support/test.cjs');
const { createHookHarness } = require('../support/hooks.cjs');
const hooks = createHookHarness();
const { createModuleMock } = require('../support/mock-module.cjs');
const { find } = require('../support/tree.cjs');
const mock = createModuleMock(require);
let routes, state, params;
mock('react', hooks.react);
mock('react-native', {
  Keyboard: { dismiss() {} },
  Pressable: 'Pressable',
  SectionList: 'SectionList',
  Text: 'Text',
  View: 'View',
});
mock('react-native-safe-area-context', { SafeAreaView: 'SafeAreaView' });
mock('@expo/vector-icons/Feather', 'Feather');
mock('expo-router', {
  router: {
    push: (route) => routes.push({ method: 'push', route }),
    dismissTo: (route) => routes.push({ method: 'dismissTo', route }),
  },
  useLocalSearchParams: () => params,
});
const theme = require('../../src/components/ui/palette.ts').light;
mock('../../src/components/ui/index.tsx', {
  Input: 'Input',
  Label: 'Label',
  useTheme: () => theme,
});
mock('../../src/features/planner/hooks/usePlannerSearch.ts', { usePlannerSearch: () => state });
const Screen = require('../../src/features/planner/screens/SearchScreen.tsx').default;
const readSearchDate = require('../../src/features/planner/hooks/useSearchDate.ts').useSearchDate;
function handleDate(callback) {
  hooks.render(() => readSearchDate(callback));
}
const daily = {
  key: 'daily:a',
  date: '2020-01-04',
  content: '오래된 회의',
  kind: 'daily',
  time: null,
};
beforeEach(() => {
  routes = [];
  params = {};
  hooks.reset();
  state = {
    query: '회의',
    setQuery() {},
    sections: [{ month: '2020-01', data: [daily] }],
    hasQuery: true,
    searching: false,
  };
});

test('dedicated search screen renders a scrolling section list and search field across all months', () => {
  const tree = Screen();
  assert.equal(tree.type, 'SafeAreaView');
  const input = find(tree, (node) => node.type === 'Input');
  assert.equal(input.props.placeholder, '일정과 메모 검색 (휴지통 포함)');
  const list = find(tree, (node) => node.type === 'SectionList');
  assert.deepEqual(list.props.sections, state.sections);
  assert.equal(list.props.keyboardShouldPersistTaps, 'handled');
  const row = list.props.renderItem({ item: daily });
  const pressable = row.type(row.props);
  pressable.props.onPress();
  assert.equal(routes[0].method, 'dismissTo');
  assert.equal(routes[0].route.pathname, '/');
  assert.equal(routes[0].route.params.searchDate, '2020-01-04');
});

test('recurring search results open the matching recurring editor', () => {
  const list = find(Screen(), (node) => node.type === 'SectionList');
  const row = list.props.renderItem({
    item: { ...daily, kind: 'recurring', recurringId: 'repeat', endDate: null },
  });
  row.type(row.props).props.onPress();
  assert.deepEqual(routes, [
    { method: 'push', route: { pathname: '/recurring', params: { id: 'repeat' } } },
  ]);
});

test('returning from search navigates once per selection and rejects invalid dates', () => {
  const dates = [];
  const navigate = (date) => dates.push(date);
  params = { searchDate: '2020-01-04', searchKey: 'first' };
  handleDate(navigate);
  handleDate(navigate);
  params = { searchDate: '2035-09-12', searchKey: 'second' };
  handleDate(navigate);
  params = { searchDate: '2026-02-30', searchKey: 'invalid' };
  handleDate(navigate);
  params = { searchDate: ['2026-11-01'], searchKey: 'array' };
  handleDate(navigate);
  assert.deepEqual(dates, ['2020-01-04', '2035-09-12']);
});

test('memo and trash results open the exact memo instead of navigating to a calendar date', () => {
  const list = find(Screen(), (node) => node.type === 'SectionList');
  for (const kind of ['memo', 'trash']) {
    const row = list.props.renderItem({ item: { ...daily, kind, memoId: 'memo-' + kind } });
    const rendered = row.type(row.props);
    assert.match(rendered.props.accessibilityLabel, kind === 'trash' ? /휴지통/ : /메모/);
    rendered.props.onPress();
    const route = routes.at(-1);
    assert.equal(route.method, 'push');
    assert.equal(route.route.pathname, '/notes');
    assert.equal(route.route.params.memoId, 'memo-' + kind);
  }
});
