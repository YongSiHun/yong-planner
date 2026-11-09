import { design } from './tokens';
import type { Theme } from './palette';

export const dialogKeyboardAvoidingViewStyle = { flex: 1 } as const;

export function dialogSafeAreaViewStyle(theme: Theme) {
  return {
    flex: 1,
    justifyContent: 'center',
    padding: design.space.lg,
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

export function dialogViewStyle(theme: Theme, height?: number) {
  return {
    backgroundColor: theme.bg,
    borderRadius: design.radius.dialog,
    borderWidth: 1,
    borderColor: theme.line,
    padding: design.space.lg,
    height,
    maxHeight: '85%',
    gap: design.space.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  } as const;
}

export const dialogScrollViewStyle = { flexShrink: 1, width: '100%' } as const;

export const dialogScrollViewContentContainerStyle = { gap: design.space.md } as const;

export const dialogViewStyle2 = { width: '100%' } as const;

export const dialogHeadingViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.sm,
} as const;

export const dialogHeadingLabelStyle = {
  flex: 1,
  fontSize: design.type.title,
  lineHeight: design.lineHeights.title,
  fontFamily: design.font.bold,
} as const;

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
