import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const themeSettingsLabelStyle = { marginTop: 20, fontWeight: '700' } as const;

export const backupSettingsLabelStyle = { fontWeight: '700' } as const;

export function settingsScreenScrollViewStyle(theme: Theme) {
  return [layoutStyles.page, { backgroundColor: theme.bg } as const] as const;
}

export const settingsScreenScrollViewContentContainerStyle = {
  paddingBottom: 40,
  gap: 16,
} as const;

export function settingsScreenViewStyle(theme: Theme) {
  return { height: 1, backgroundColor: theme.line } as const;
}

export const settingsScreenLabelStyle = { fontSize: design.type.caption, lineHeight: 18 } as const;

export const settingsScreenLabelStyle2 = { fontSize: design.type.caption } as const;
