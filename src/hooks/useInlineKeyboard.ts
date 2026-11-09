import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type TextInput,
} from 'react-native';

export function useInlineKeyboard(
  scrollRef: RefObject<ComponentRef<typeof ScrollView> | null>,
  scrollKey?: string,
) {
  const offset = useRef(0);
  const focusedInput = useRef<ComponentRef<typeof TextInput> | null>(null);
  const frame = useRef<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    offset.current = 0;
  }, [scrollKey]);
  const revealInput = useCallback(() => {
    const input = focusedInput.current;
    const hasInput = input !== null;

    if (hasInput) {
      input.measureInWindow((_, top, __, height) => {
        const keyboardTop = Math.min(
          Keyboard.metrics()?.screenY ?? Infinity,
          Dimensions.get('window').height,
        );
        const overlap = top + height + 16 - keyboardTop;
        const isCovered = overlap > 0 && focusedInput.current === input;

        if (isCovered) {
          scrollRef.current?.scrollTo({ y: offset.current + overlap, animated: false });
        }
      });
    }
  }, [scrollRef]);
  const scheduleReveal = useCallback(() => {
    const hasFrame = frame.current !== null;

    if (hasFrame) {
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      revealInput();
    });
  }, [revealInput]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scheduleReveal();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    const resize = Keyboard.addListener('keyboardDidChangeFrame', scheduleReveal);

    return () => {
      show.remove();
      hide.remove();
      resize.remove();
      focusedInput.current = null;
      const hasFrame = frame.current !== null;

      if (hasFrame) {
        cancelAnimationFrame(frame.current!);
      }
    };
  }, [scheduleReveal]);

  const handleInputFocus = useCallback(
    (input: ComponentRef<typeof TextInput> | null) => {
      focusedInput.current = input;
      scheduleReveal();
    },
    [scheduleReveal],
  );

  const handleKeyboardScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);

  return { keyboardVisible, handleInputFocus, scheduleReveal, handleKeyboardScroll };
}
