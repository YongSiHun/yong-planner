import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function container(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    width: '100%',
    flexShrink: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  } as const;
}

export const count = { fontSize: design.type.small, paddingHorizontal: 0 } as const;

export const viewport = { width: '100%', flexGrow: 0, flexShrink: 0 } as const;

export const actions = {
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: design.space.sm,
  paddingHorizontal: design.space.xs,
  paddingVertical: 0,
} as const;

export const action = {
  minHeight: design.touchTarget,
  minWidth: 0,
  flexShrink: 0,
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 0,
  backgroundColor: 'transparent',
} as const;

export const summary = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: design.space.sm,
  paddingVertical: design.space.xs,
} as const;

export const cancel = {
  minHeight: 32,
  minWidth: 0,
  paddingHorizontal: 0,
  paddingVertical: 0,
  backgroundColor: 'transparent',
} as const;
