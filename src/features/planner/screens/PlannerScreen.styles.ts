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

export function plannerScreenScrollViewContentContainerStyle(
  selectionActive: boolean,
  selectionCopySource: boolean,
) {
  return {
    paddingHorizontal: design.space.xs,
    paddingBottom:
      selectionActive || selectionCopySource
        ? design.space.md
        : design.touchTarget + design.space.md * 2,
  } as const;
}

export const surface = { flex: 1 } as const;
export const frame = layout.page;
