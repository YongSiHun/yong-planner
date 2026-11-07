require('./register.cjs');
const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
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
    Dimensions: { get: () => ({ height: 800 }) },
  },
};
global.requestAnimationFrame = (callback) => {
  frames.set(++frameId, callback);
  return frameId;
};
global.cancelAnimationFrame = (id) => frames.delete(id);
const { useInlineKeyboard } = require('../src/features/planner/hooks/useInlineKeyboard.ts');
function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback());
}
function setup() {
  const calls = [];
  // React 훅을 위의 테스트 대역으로 실행하는 하네스다.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const controller = useInlineKeyboard({ current: { scrollTo: (options) => calls.push(options) } });
  return { calls, controller };
}
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  frames.clear();
  keyboard.visible = false;
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
