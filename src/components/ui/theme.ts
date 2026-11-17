import { createContext, useContext } from 'react';
import { light } from './palette';

export const ThemeContext = createContext(light);

export function useTheme() {
  return useContext(ThemeContext);
}
