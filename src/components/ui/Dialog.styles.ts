import { design } from './/tokens';
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

export function dialogViewStyle(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderRadius: design.radius.dialog,
    borderWidth: 1,
    borderColor: theme.line,
    padding: design.space.lg,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  } as const;
}

export const dialogScrollViewStyle = { flexShrink: 1 } as const;

export const dialogScrollViewContentContainerStyle = { gap: design.space.md } as const;

export const dialogViewStyle2 = { marginTop: design.space.md } as const;

export const dialogHeadingViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: design.space.md,
} as const;

export const dialogHeadingLabelStyle = {
  flex: 1,
  fontSize: design.type.title,
  fontFamily: design.font.bold,
} as const;

export const dialogHeadingPressableStyle = {
  width: design.touchTarget,
  height: design.touchTarget,
  alignItems: 'center',
  justifyContent: 'center',
} as const;
