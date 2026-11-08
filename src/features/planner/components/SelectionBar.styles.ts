import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function container(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingHorizontal: design.space.md,
    paddingVertical: design.space.xs,
  } as const;
}

export const summary = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const;

export const count = { fontSize: design.type.small } as const;

export const actions = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: design.space.xs,
} as const;

export const action = {
  minHeight: design.touchTarget,
  flexGrow: 1,
  flexBasis: 128,
  paddingHorizontal: design.space.md,
  paddingVertical: design.space.sm,
} as const;
