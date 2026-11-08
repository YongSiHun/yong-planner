import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const dateInfoViewStyle = { paddingBottom: design.space.sm } as const;

export function dateInfoViewStyle2(theme: Theme) {
  return {
    padding: design.space.md,
    backgroundColor: theme.selected,
    borderRadius: design.radius.medium,
    borderWidth: 1,
    borderColor: theme.line,
  } as const;
}

export function dateInfoLabelStyle(theme: Theme) {
  return {
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
    fontFamily: design.font.medium,
    color: theme.text,
  } as const;
}
