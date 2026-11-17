const React = require('react');

// A deterministic hook harness, not a React renderer. Call render() explicitly after updates.
function createHookHarness() {
  let slots = [];
  let cursor = 0;
  let effects = [];
  let layouts = [];
  let stateWrites = 0;
  const changed = (before, after) =>
    !after || !before || after.some((value, i) => !Object.is(value, before[i]));
  const flush = (queue) => queue.splice(0).forEach((effect) => effect());

  function useState(initial) {
    const index = cursor++;
    slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
    const slot = slots[index];
    slot.set ??= (next) => {
      stateWrites++;
      slot.value = typeof next === 'function' ? next(slot.value) : next;
    };
    return [slot.value, slot.set];
  }

  function useRef(initial) {
    const index = cursor++;
    slots[index] ??= { current: initial };
    return slots[index];
  }

  function memoValue(factory, deps) {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || changed(previous.deps, deps)) slots[index] = { deps, value: factory() };
    return slots[index].value;
  }

  function effect(queue, callback, deps) {
    const index = cursor++;
    const previous = slots[index];
    if (previous && !changed(previous.deps, deps)) return;
    const slot = { deps };
    slots[index] = slot;
    queue.push(() => {
      previous?.cleanup?.();
      slot.cleanup = callback();
    });
  }

  function unmount() {
    slots.forEach((slot) => slot?.cleanup?.());
    slots = [];
    effects = [];
    layouts = [];
  }

  const beginRender = () => {
    cursor = 0;
  };
  const flushLayoutEffects = () => flush(layouts);
  const flushEffects = () => flush(effects);

  return {
    react: {
      ...React,
      useState,
      useRef,
      useMemo: memoValue,
      useCallback: (callback, deps) => memoValue(() => callback, deps),
      useEffect: (callback, deps) => effect(effects, callback, deps),
      useLayoutEffect: (callback, deps) => effect(layouts, callback, deps),
    },
    beginRender,
    getStateWrites: () => stateWrites,
    flushLayoutEffects,
    flushEffects,
    unmount,
    reset() {
      unmount();
      beginRender();
    },
    render(callback, { layout = true } = {}) {
      beginRender();
      const result = callback();
      if (layout) flushLayoutEffects();
      flushEffects();
      return result;
    },
  };
}

module.exports = { createHookHarness };
