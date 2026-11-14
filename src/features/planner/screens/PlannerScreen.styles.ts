import { layout } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function plannerScreenKeyboardAvoidingViewStyle(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}

export function plannerScreenSafeAreaViewStyle(theme: Theme) {
  return {
    flex: 1,
    backgroundColor: theme.bg,
  } as const;
}

export function plannerScreenScrollViewContentContainerStyle() {
  return {
    paddingHorizontal: design.space.xs,
    paddingBottom: design.touchTarget + design.space.md * 2,
  } as const;
}

export const surface = { flex: 1 } as const;
export const frame = layout.page;

export const footerOverlay = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  minHeight: design.touchTarget + design.space.md * 2,
} as const;
