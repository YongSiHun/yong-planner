import {
  content as settingsContent,
  section,
  headingRow,
  filledButton,
  buttonLabelSize,
  heading as settingsHeading,
  divider as settingsDivider,
} from '../../../components/ui/settings.styles';
import { layout } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function screen(theme: Theme) {
  return [layout.page, { backgroundColor: theme.bg } as const] as const;
}
export const content = settingsContent;
export const displaySection = section;
export const toggleGroup = { gap: design.space.xs } as const;
export const permissionHeadingRow = { ...headingRow, justifyContent: 'space-between' } as const;
export const permissionValue = {
  fontSize: design.type.action,
  lineHeight: design.lineHeights.action,
  fontFamily: design.font.medium,
} as const;
export const permissionSection = section;
export const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: design.space.md,
  minHeight: design.touchTarget,
} as const;
export const title = {
  flex: 1,
  minWidth: 0,
  fontFamily: design.font.medium,
  fontSize: buttonLabelSize,
  lineHeight: design.lineHeights.body,
} as const;
export const heading = settingsHeading;
export const error = { ...section, marginTop: design.space.md } as const;
export const textAction = filledButton;
export const note = { fontSize: design.type.small } as const;
export const divider = settingsDivider;
export function errorLabel(theme: Theme) {
  return { color: theme.red, fontSize: design.type.body } as const;
}
