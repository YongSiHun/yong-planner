require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const React = require('react');
const { createModuleMock } = require('../support/mock-module.cjs');
const { find } = require('../support/tree.cjs');
const mock = createModuleMock(require);
let routes, state, params, refs, cursor;
mock('react', {
  ...React,
  useEffect: (effect) => effect(),
  useRef(initial) {
    const index = cursor++;
    refs[index] ??= { current: initial };
    return refs[index];
  },
});
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
  cursor = 0;
  readSearchDate(callback);
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
  refs = [];
  cursor = 0;
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
  assert.equal(input.props.placeholder, '모든 달의 일정 검색');
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
