import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function chip(selected: boolean, theme: Theme, important = false) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      backgroundColor: chipBackground(selected, important, theme),
      borderColor: selected || important ? theme.accent : theme.line,
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

export function importantMark(selected: boolean, theme: Theme) {
  return {
    width: 16,
    height: 16,
    borderRadius: design.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chipBackground(selected, true, theme),
  } as const;
}

export function chipLabel(selected: boolean, theme: Theme, important = false) {
  return {
    color: selected ? theme.onAccent : theme.text,
    fontFamily: important ? design.font.bold : design.font.regular,
    includeFontPadding: false,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
    flexShrink: 1,
  } as const;
}

export function chipEdge(side: 'left' | 'right') {
  return { position: 'absolute', [side]: 0, top: 0, bottom: 0, width: 8 } as const;
}

function chipBackground(selected: boolean, important: boolean, theme: Theme): string {
  if (selected) {
    return theme.accent;
  }

  return important ? theme.selected : theme.bg;
}
