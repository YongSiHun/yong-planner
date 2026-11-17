import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const page = { flex: 1 } as const;

export function editor(theme: Theme) {
  return {
    flex: 1,
    padding: design.layout.pagePadding,
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
  } as const;
}

export function validation(theme: Theme, error: boolean) {
  return {
    paddingHorizontal: design.layout.pagePadding,
    paddingVertical: design.space.sm,
    fontSize: design.type.small,
    fontFamily: design.font.regular,
    lineHeight: design.lineHeights.small,
    color: error ? theme.red : theme.muted,
  } as const;
}
