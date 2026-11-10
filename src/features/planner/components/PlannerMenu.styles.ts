import { design } from '../../../components/ui/tokens';

export const plannerMenuViewStyle = {
  gap: design.space.sm,
  paddingVertical: design.space.xs,
} as const;

export const plannerMenuButtonStyle = {
  minHeight: 48,
  alignItems: 'center',
  paddingHorizontal: 0,
  paddingVertical: design.space.md,
} as const;

export const exportMenu = {
  ...plannerMenuViewStyle,
  gap: 0,
  paddingVertical: 0,
} as const;

export const exportButton = {
  ...plannerMenuButtonStyle,
  minHeight: design.touchTarget,
  paddingVertical: design.space.sm,
} as const;
