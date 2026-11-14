import { design } from './tokens';
import type { Theme } from './palette';

export const dialogKeyboardAvoidingViewStyle = { flex: 1 } as const;

export function dialogSafeAreaViewStyle(theme: Theme, keyboardVisible = false) {
  return {
    flex: 1,
    justifyContent: keyboardVisible ? 'flex-end' : 'center',
    padding: design.space.lg,
    paddingBottom: keyboardVisible ? design.space.sm : design.space.lg,
    backgroundColor: theme.scrim,
  } as const;
}

export const dialogPressableStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
} as const;

export function dialogViewStyle(
  theme: Theme,
  height?: number,
  maxWidth: number = design.layout.dialogMaxWidth,
  paddingVertical?: number,
  contentGap: number = design.space.sm,
) {
  return {
    backgroundColor: theme.bg,
    borderRadius: design.space.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: design.space.md,
    paddingVertical,
    height,
    maxHeight: '85%',
    gap: contentGap,
    width: '100%',
    maxWidth,
    alignSelf: 'center',
  } as const;
}

export const dialogScrollViewStyle = { flexGrow: 0, flexShrink: 1, width: '100%' } as const;

export const dialogScrollViewContentContainerStyle = { gap: design.space.sm } as const;

export const dialogViewStyle2 = { width: '100%' } as const;

export const dialogHeadingViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.sm,
} as const;

export const dialogHeadingContent = { flex: 1, minWidth: 0, gap: design.space.xs } as const;

export function dialogHeadingLabelStyle(size: number = design.type.action) {
  return {
    fontSize: size,
    lineHeight: design.lineHeights.title + size - design.type.title,
    fontFamily: design.font.bold,
  } as const;
}

export const dialogHeadingPressableStyle = {
  width: design.touchTarget,
  height: design.touchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: -design.space.md,
} as const;

export const actions = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignItems: 'center',
  columnGap: design.space.lg,
  rowGap: design.space.sm,
} as const;

export const action = {
  alignSelf: 'flex-end',
  minHeight: design.touchTarget,
  minWidth: design.touchTarget,
  paddingHorizontal: 0,
  paddingVertical: design.space.sm,
  backgroundColor: 'transparent',
} as const;

export const fixedBody = {
  flexGrow: 0,
  flexShrink: 1,
  minHeight: 0,
  width: '100%',
  gap: design.space.sm,
} as const;

const compactHeadingClose = { marginVertical: -design.space.sm } as const;

export function dialogHeadingCloseStyle(compact: boolean) {
  return [dialogHeadingPressableStyle, compact && compactHeadingClose];
}
