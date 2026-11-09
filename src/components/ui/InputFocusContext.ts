import { createContext, type ComponentRef } from 'react';
import type { TextInput } from 'react-native';

export const InputFocusContext = createContext<
  ((input: ComponentRef<typeof TextInput> | null) => void) | undefined
>(undefined);
