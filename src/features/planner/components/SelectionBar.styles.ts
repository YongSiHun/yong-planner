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

export const viewport = { flexGrow: 0, flexShrink: 0 } as const;

export const count = { fontSize: design.type.small, alignSelf: 'center' } as const;

export const actions = {
  flexDirection: 'row',
  gap: design.space.sm,
  paddingVertical: design.space.xs,
} as const;

export const action = {
  minHeight: 52,
  minWidth: 128,
  paddingHorizontal: design.space.md,
  paddingVertical: design.space.sm,
} as const;
