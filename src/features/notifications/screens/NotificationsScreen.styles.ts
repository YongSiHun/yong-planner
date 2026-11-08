import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function screen(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}
export const content = {
  padding: design.space.md,
  gap: design.space.sm,
  width: '100%',
  maxWidth: 720,
  alignSelf: 'center',
} as const;
export const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: design.space.md,
  minHeight: 48,
} as const;
export const title = {
  flex: 1,
  fontFamily: design.font.medium,
  fontSize: design.type.body,
} as const;
export const heading = { fontFamily: design.font.bold, fontSize: design.type.title } as const;
export const error = { gap: design.space.sm } as const;
export function track(theme: Theme) {
  return { false: theme.line, true: theme.accent };
}
export function divider(theme: Theme) {
  return { height: 1, backgroundColor: theme.line, marginVertical: design.space.sm } as const;
}
export function errorLabel(theme: Theme) {
  return { color: theme.red, fontSize: design.type.action } as const;
}
