import { design } from './tokens';

export const actions = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: design.space.sm,
} as const;

export const action = {
  minHeight: design.touchTarget,
  paddingHorizontal: design.space.md,
  paddingVertical: design.space.sm,
} as const;
