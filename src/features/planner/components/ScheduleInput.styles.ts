import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function chip(selected: boolean, theme: Theme, important = false) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      backgroundColor: chipBackground(selected, important, theme),
      borderColor: selected ? theme.accent : theme.line,
      borderWidth: 1,
      borderRadius: design.radius.pill,
      paddingHorizontal: design.space.sm,
      paddingVertical: 3,
      minHeight: 30,
      maxWidth: '100%',
      opacity: pressed ? 0.75 : 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    }) as const;
}

export function chipLabel(selected: boolean, theme: Theme) {
  return {
    color: selected ? theme.onAccent : theme.text,
    fontFamily: design.font.regular,
    includeFontPadding: false,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
    flexShrink: 1,
  } as const;
}

export function chipEdge(side: 'left' | 'right') {
  return { position: 'absolute', [side]: 0, top: 0, bottom: 0, width: 8 } as const;
}

export function field(theme: Theme) {
  return {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 4,
    padding: 4,
    marginVertical: 3,
    minHeight: design.touchTarget,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: design.radius.small,
    backgroundColor: theme.selected,
  } as const;
}

export function measurement(availableWidth: number) {
  return {
    position: 'absolute',
    opacity: 0,
    maxWidth: Math.max(1, availableWidth - 18),
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}

export function input(
  editText: string,
  theme: Theme,
  height: number,
  maximumHeight: number,
  inputWidth: number,
) {
  return {
    fontFamily: design.font.regular,
    fontSize: noteFontSize(editText),
    lineHeight: design.lineHeight,
    color: theme.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: Math.min(height, maximumHeight),
    minHeight: design.rowMinHeight,
    width: inputWidth,
    minWidth: 30,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 1,
  } as const;
}

export const emptyPreview = {
  minHeight: design.rowMinHeight,
  justifyContent: 'center',
  paddingVertical: 7,
} as const;

export const preview = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  paddingVertical: 4,
  minHeight: design.rowMinHeight,
} as const;

export function chipWrapper(draggingIndex: number | null | undefined, index: number) {
  return { maxWidth: '100%', flexShrink: 1, opacity: draggingIndex === index ? 0.35 : 1 } as const;
}

export function activeTime(theme: Theme) {
  return {
    fontFamily: design.font.medium,
    color: theme.accent,
    fontSize: design.type.small,
    lineHeight: design.lineHeight,
    paddingVertical: 4,
  } as const;
}

function noteFontSize(text: string): number {
  return text.length === 0 ? design.type.small : design.type.body;
}

function chipBackground(selected: boolean, important: boolean, theme: Theme): string {
  if (selected) {
    return theme.accent;
  }

  return important ? theme.selected : theme.bg;
}
