import { design } from '../../../components/ui/tokens';

export const plannerMenuViewStyle = {
  gap: design.space.sm,
  paddingVertical: design.space.xs,
} as const;

export const plannerMenuButtonStyle = {
  minHeight: design.touchTarget,
  alignItems: 'center',
  paddingHorizontal: 0,
  paddingVertical: design.space.sm,
} as const;
