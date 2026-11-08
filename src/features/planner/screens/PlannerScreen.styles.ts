import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function plannerScreenKeyboardAvoidingViewStyle(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}

export function plannerScreenSafeAreaViewStyle(theme: Theme) {
  return {
    flex: 1,
    backgroundColor: theme.bg,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  } as const;
}

export function plannerScreenScrollViewContentContainerStyle(
  selectionActive: boolean,
  selectionCopySource: boolean,
) {
  return {
    paddingHorizontal: design.space.xs,
    paddingBottom: selectionActive || selectionCopySource ? 12 : 76,
  } as const;
}

export const surface = { flex: 1 } as const;
