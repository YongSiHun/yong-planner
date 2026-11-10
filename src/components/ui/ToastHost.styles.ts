import type { Theme } from './palette';
import { design } from './tokens';

export function position(bottom: number) {
  return {
    position: 'absolute',
    bottom: bottom + design.space.lg,
    left: design.space.lg,
    right: design.space.lg,
    alignItems: 'center',
    zIndex: 100,
    elevation: 20,
  } as const;
}

export function message(theme: Theme) {
  return {
    backgroundColor: theme.text,
    color: theme.bg,
    fontFamily: design.font.medium,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
    borderRadius: design.radius.medium,
    paddingHorizontal: design.space.lg,
    paddingVertical: design.space.sm,
    maxWidth: design.layout.dialogMaxWidth,
    overflow: 'hidden',
  } as const;
}
