import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const themeSettingsLabelStyle = { fontFamily: design.font.bold } as const;

export const backupSettingsLabelStyle = { fontFamily: design.font.bold } as const;

export function settingsScreenScrollViewStyle(theme: Theme) {
  return [layoutStyles.page, { backgroundColor: theme.bg } as const] as const;
}

export const settingsScreenScrollViewContentContainerStyle = {
  ...layoutStyles.pageContent,
  alignItems: 'flex-start',
} as const;

export function settingsScreenViewStyle(theme: Theme) {
  return { width: '100%', height: 1, backgroundColor: theme.line } as const;
}

export const settingsScreenLabelStyle = {
  fontSize: design.type.caption,
  lineHeight: design.lineHeights.caption,
} as const;

export const settingsScreenLabelStyle2 = { fontSize: design.type.caption } as const;

export const settingsButtonStyle = layoutStyles.textAction;
