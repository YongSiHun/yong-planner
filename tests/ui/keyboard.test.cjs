const { createModuleMock } = require('../support/mock-module.cjs');
require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const React = require('react');
let windowHeight = 800;
const platform = { OS: 'android' };
const cleanups = [];
const frames = new Map();
let frameId = 0;
const listeners = new Map();
const keyboard = {
  visible: false,
  top: 400,
  isVisible() {
    return this.visible;
  },
  metrics() {
    return this.visible ? { screenY: this.top } : undefined;
  },
  addListener(name, listener) {
    listeners.set(name, listener);
    return { remove: () => listeners.delete(name) };
  },
};
const reactPath = require.resolve('react');
const nativePath = require.resolve('react-native');
require.cache[reactPath] = {
  id: reactPath,
  filename: reactPath,
  loaded: true,
  exports: {
    ...React,
    createContext: (value) => ({ value, Provider: 'Provider' }),
    useContext: (context) => context.value,
    useRef: (current) => ({ current }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useCallback: (callback) => callback,
    useEffect: (callback) => {
      const cleanup = callback();
      if (cleanup) cleanups.push(cleanup);
    },
  },
};
require.cache[nativePath] = {
  id: nativePath,
  filename: nativePath,
  loaded: true,
  exports: {
    Keyboard: keyboard,
    Platform: platform,
    Dimensions: { get: () => ({ height: windowHeight }) },
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Modal: 'Modal',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    View: 'View',
    TextInput: 'TextInput',
    Text: 'Text',
  },
};
global.requestAnimationFrame = (callback) => {
  frames.set(++frameId, callback);
  return frameId;
};
global.cancelAnimationFrame = (id) => frames.delete(id);
const { useInlineKeyboard } = require('../../src/hooks/useInlineKeyboard.ts');
function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback());
}
function setup() {
  const calls = [];
  // React 훅: mock 하네스 실행.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const controller = useInlineKeyboard({
    current: {
      scrollTo: (options) => calls.push(options),
      measureInWindow: (callback) => callback(0, 0, 360, windowHeight),
    },
  });
  return { calls, controller };
}
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  frames.clear();
  keyboard.visible = false;
  keyboard.top = 400;
  windowHeight = 800;
  platform.OS = 'android';
});

test('keyboard initial visibility preserves the native method receiver', () => {
  keyboard.visible = true;
  assert.equal(setup().controller.keyboardVisible, true);
});

test('a covered input scrolls only by the overlap, preserving the current scroll position', () => {
  keyboard.visible = true;
  const { controller, calls } = setup();
  controller.handleKeyboardScroll({ nativeEvent: { contentOffset: { y: 500 } } });
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 350, 200, 100) });
  flushFrames();
  assert.deepEqual(calls, [{ y: 566, animated: false }]);
});

test('an already visible input or a blurred input does not move the page', () => {
  keyboard.visible = true;
  const { controller, calls } = setup();
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 100, 200, 40) });
  flushFrames();
  assert.deepEqual(calls, []);
  controller.handleInputFocus(null);
  flushFrames();
  assert.deepEqual(calls, []);
});

test('measurements arriving after blur cannot scroll a stale input', () => {
  keyboard.visible = true;
  const { controller, calls } = setup();
  let measured;
  controller.handleInputFocus({
    measureInWindow: (callback) => {
      measured = callback;
    },
  });
  flushFrames();
  controller.handleInputFocus(null);
  measured(0, 450, 200, 100);
  assert.deepEqual(calls, []);
});

test('resized Android windows limit input visibility even when keyboard metrics are higher', () => {
  keyboard.visible = true;
  keyboard.top = 600;
  windowHeight = 400;
  const { controller, calls } = setup();
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 350, 200, 100) });
  flushFrames();
  assert.deepEqual(calls, [{ y: 66, animated: false }]);
});

test('changing keyboard frame reveals the focused input again without refocusing', () => {
  keyboard.visible = true;
  keyboard.top = 600;
  const { controller, calls } = setup();
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 350, 200, 100) });
  flushFrames();
  assert.deepEqual(calls, []);
  keyboard.top = 400;
  listeners.get('keyboardDidChangeFrame')();
  flushFrames();
  assert.deepEqual(calls, [{ y: 66, animated: false }]);
});

test('unmounted input measurements cannot scroll and keyboard listeners are removed', () => {
  keyboard.visible = true;
  const { controller, calls } = setup();
  let measured;
  controller.handleInputFocus({
    measureInWindow: (callback) => {
      measured = callback;
    },
  });
  flushFrames();
  cleanups.splice(0).forEach((cleanup) => cleanup());
  measured(0, 450, 200, 100);
  assert.deepEqual(calls, []);
  assert.equal(listeners.size, 0);
});

const mockModule = createModuleMock(require);
mockModule('react-native-safe-area-context', {
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
});
mockModule('@expo/vector-icons/Feather', () => null);
const { Input } = require('../../src/components/ui/index.tsx');
const { InputFocusContext } = require('../../src/components/ui/InputFocusContext.ts');
const { Dialog } = require('../../src/components/ui/Dialog.tsx');
function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}

test('shared modal input focus automatically reveals covered fields in its own scroll view', () => {
  keyboard.visible = true;
  const tree = Dialog({ title: '공휴일 보정', children: null, onClose() {}, scrollable: true });
  assert.equal(
    find(tree, (node) => node.type === 'KeyboardAvoidingView').props.behavior,
    'padding',
  );
  const body = find(tree, (node) => node.type?.name === 'DialogBody');
  const provider = body.type(body.props);
  InputFocusContext.value = provider.props.value;
  const scroll = provider.props.children;
  const calls = [];
  scroll.props.ref.current = {
    scrollTo: (options) => calls.push(options),
    measureInWindow: (callback) => callback(0, 0, 360, windowHeight),
  };
  scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 100 } } });
  const focusEvents = [];
  const input = Input({ onInputFocus: (value) => focusEvents.push(value) });
  input.props.ref.current = { measureInWindow: (callback) => callback(0, 350, 200, 100) };
  input.props.onFocus({});
  flushFrames();
  assert.deepEqual(calls, [{ y: 166, animated: false }]);
  input.props.onBlur({});
  scroll.props.onLayout();
  flushFrames();
  assert.equal(calls.length, 1);
  assert.equal(focusEvents.at(-1), null);
  InputFocusContext.value = undefined;
});

test('modal docks near the keyboard while open and centers when the keyboard is closed', () => {
  keyboard.visible = true;
  const open = Dialog({ title: '시간 설정', children: null, onClose() {} });
  const docked = find(open, (node) => node.type === 'SafeAreaView');
  assert.equal(docked.props.style.justifyContent, 'flex-end');
  assert.equal(docked.props.style.paddingBottom, 8);
  assert.equal(docked.props.edges.includes('bottom'), false);
  keyboard.visible = false;
  const closed = Dialog({ title: '시간 설정', children: null, onClose() {} });
  const centered = find(closed, (node) => node.type === 'SafeAreaView');
  assert.equal(centered.props.style.justifyContent, 'center');
  assert.equal(centered.props.style.paddingBottom, 16);
  assert.equal(centered.props.edges, undefined);
});

test('a scroll viewport above the keyboard also limits the visible input area', () => {
  keyboard.visible = true;
  const calls = [];

  const controller = useInlineKeyboard({
    current: {
      measureInWindow: (callback) => callback(0, 80, 360, 260),
      scrollTo: (options) => calls.push(options),
    },
  });
  controller.handleKeyboardScroll({ nativeEvent: { contentOffset: { y: 100 } } });
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 300, 200, 80) });
  flushFrames();
  assert.deepEqual(calls, [{ y: 156, animated: false }]);
});

test('switching focus while viewport measurement is pending cannot scroll the previous field', () => {
  keyboard.visible = true;
  let measured;
  const calls = [];

  const controller = useInlineKeyboard({
    current: {
      measureInWindow: (callback) => {
        measured = callback;
      },
      scrollTo: (options) => calls.push(options),
    },
  });
  controller.handleInputFocus({ measureInWindow: (callback) => callback(0, 450, 200, 80) });
  flushFrames();
  controller.handleInputFocus(null);
  measured(0, 0, 360, 340);
  assert.deepEqual(calls, []);
});
