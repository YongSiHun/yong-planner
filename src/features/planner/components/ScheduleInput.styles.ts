import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

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
    includeFontPadding: false,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}

export function input(theme: Theme, height: number, maximumHeight: number, inputWidth: number) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
    includeFontPadding: false,
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
export { chip, importantMark, chipLabel, chipEdge } from './ScheduleChip.styles';
export { emptyPreview, preview, chipWrapper } from './SchedulePreview.styles';
