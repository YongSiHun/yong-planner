require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { createModuleMock } = require('../support/mock-module.cjs');
const { find } = require('../support/tree.cjs');
const mock = createModuleMock(require);
mock('react', { ...React, useEffect() {} });
mock('react-native', {
  BackHandler: {},
  StyleSheet: { create: (styles) => styles },
  Keyboard: { dismiss() {} },
  Modal: 'Modal',
  useWindowDimensions: () => ({ width: 400 }),
  FlatList: 'FlatList',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android' },
  Pressable: 'Pressable',
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
});
mock('react-native-safe-area-context', {
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 24, right: 0 }),
});
mock('@expo/vector-icons/Feather', 'Feather');
mock('expo-router', { Stack: { Screen: 'StackScreen' } });
const theme = require('../../src/components/ui/palette.ts').light;
mock('../../src/components/ui/index.tsx', {
  Label: 'Label',
  useTheme: () => theme,
  design: require('../../src/components/ui/tokens.ts').design,
});
let state;
mock('../../src/features/notes/hooks/useMemoState.ts', { useMemoState: () => state });
const NotesScreen = require('../../src/features/notes/screens/NotesScreen.tsx').default;
function navigation() {
  const node = find(NotesScreen(), (node) => node.type?.name === 'NotesNavigation');
  return node.type(node.props).props.options;
}
function expand(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
}
function initialState() {
  return {
    memos: [],
    selected: new Set(),
    disabled: false,
    busy: false,
    title: '',
    content: '',
    selecting: false,
    editing: undefined,
    editorMenuOpen: false,
    openEditorMenu() {},
    closeEditorMenu() {},
    requestEditorDelete() {},
    open() {},
    setTitle() {},
    setContent() {},
    closeEditor() {},
    cancelSelection() {},
    requestDelete() {},
    save() {},
    run() {},
  };
}

test('memo list header has only the add action; the empty list has no counter or hint toolbar', () => {
  state = initialState();
  const options = navigation();
  const actions = expand(options.headerRight());
  assert.equal(actions.props.accessibilityLabel, '메모 추가');
  const tree = expand(NotesScreen());
  assert.equal(
    find(tree, (node) => node.props?.children === '메모 0개'),
    undefined,
  );
  assert.equal(
    find(tree, (node) => node.props?.children === '길게 눌러 선택'),
    undefined,
  );
});

test('editor header places check-save left of the title and a vertical menu on the right', () => {
  state = { ...initialState(), editing: null, title: '제목', content: '본문' };
  let changed;
  state.setTitle = (value) => {
    changed = value;
  };
  const options = navigation();
  const save = expand(options.headerLeft());
  assert.equal(save.props.accessibilityLabel, '메모 저장');
  assert.equal(save.props.children.props.name, 'check');
  const title = expand(options.headerTitle());
  assert.equal(title.type, 'TextInput');
  assert.equal(title.props.accessibilityLabel, '메모 제목');
  title.props.onChangeText('수정한 제목');
  assert.equal(changed, '수정한 제목');
  const actions = expand(options.headerRight());
  assert.equal(actions.props.accessibilityLabel, '메모 메뉴');
  assert.equal(actions.props.children.props.name, 'more-vertical');
  const body = find(
    expand(NotesScreen()),
    (node) => node.props?.accessibilityLabel === '메모 본문',
  );
  assert.equal(body.props.value, '본문');
});

test('selection header has only clear-all, no count or cancel, and deletion stays in the bottom bar', () => {
  state = { ...initialState(), selecting: true, selected: new Set(['a', 'b']), requestDelete() {} };
  const options = navigation();
  assert.equal(options.title, '메모');
  assert.equal(expand(options.headerRight()).props.accessibilityLabel, '전체 해제');
  const tree = expand(NotesScreen());
  assert.ok(find(tree, (node) => node.props?.accessibilityLabel === '선택한 메모 삭제'));
  assert.equal(
    find(tree, (node) => node.props?.accessibilityLabel === '취소'),
    undefined,
  );
});

test('editor menu exposes deletion without a close command', () => {
  state = { ...initialState(), editing: { id: 'a' }, editorMenuOpen: true };
  let requested = 0;
  state.requestEditorDelete = () => {
    requested++;
  };
  const tree = expand(NotesScreen());
  const deletion = find(tree, (node) => node.props?.accessibilityLabel === '메모 삭제');
  deletion.props.onPress();
  assert.equal(requested, 1);
  assert.equal(
    find(tree, (node) => node.props?.accessibilityLabel === '닫기'),
    undefined,
  );
});

test('tapping the selection heading or list background clears the selection', () => {
  state = { ...initialState(), selecting: true, selected: new Set(['a']) };
  let cleared = 0;
  state.cancelSelection = () => {
    cleared++;
  };
  const heading = expand(navigation().headerTitle());
  heading.props.onPress();
  const tree = expand(NotesScreen());
  const background = find(
    tree,
    (node) => node.type === 'Pressable' && node.props.accessible === false,
  );
  background.props.onPress();
  assert.equal(cleared, 2);
});

test('validation errors disable check-save and appear below the memo editor', () => {
  state = {
    ...initialState(),
    editing: null,
    title: '초과 제목',
    content: '본문',
    validationError: '최대 길이 초과',
    lengthError: '최대 길이 초과',
  };
  const save = expand(navigation().headerLeft());
  assert.equal(save.props.disabled, true);
  assert.ok(find(expand(NotesScreen()), (node) => node.props?.children === '최대 길이 초과'));
});
