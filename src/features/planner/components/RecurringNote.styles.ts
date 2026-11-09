import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const recurringNotePressableStyle = { minHeight: 32, justifyContent: 'center' } as const;

export function recurringNoteTextStyle(theme: Theme) {
  return {
    color: theme.accent,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}

export function recurringNoteTextStyle2(theme: Theme) {
  return { color: theme.muted } as const;
}

export function recurringNoteInput(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
    padding: design.space.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    minHeight: design.touchTarget,
  } as const;
}

export const recurringNoteViewStyle = { paddingVertical: design.space.xs } as const;

export const recurringNoteViewStyle2 = { flexDirection: 'row', flexWrap: 'wrap' } as const;
