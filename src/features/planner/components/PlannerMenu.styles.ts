import { design } from '../../../components/ui/tokens';

export const plannerMenuViewStyle = {
  gap: design.space.sm,
  paddingVertical: design.space.xs,
} as const;

export const plannerMenuButtonStyle = {
  minHeight: 48,
  alignItems: 'flex-start',
  paddingHorizontal: 0,
  paddingVertical: design.space.md,
} as const;
