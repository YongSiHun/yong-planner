import type { Theme } from '../ui/palette';
import { design } from '../ui/tokens';

export function loadingScreenViewStyle(theme: Theme) {
  return {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.bg,
  } as const;
}

export function rootNavigationStackScreenOptions(theme: Theme) {
  return {
    headerStyle: { backgroundColor: theme.bg } as const,
    headerTintColor: theme.accent,
    headerTitleStyle: {
      fontFamily: design.font.bold,
      fontWeight: 'normal',
      fontSize: design.type.title,
      lineHeight: design.lineHeights.title,
    } as const,
    contentStyle: { backgroundColor: theme.bg } as const,
    headerShadowVisible: false,
  } as const;
}

export function rootLayoutStatusBarStyle(isDarkTheme: boolean) {
  return isDarkTheme ? 'light' : 'dark';
}

export const splashImage = { width: 240, maxWidth: '100%', height: 240 } as const;
