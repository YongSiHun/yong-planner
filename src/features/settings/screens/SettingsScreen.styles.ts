import { content, divider, heading, filledButton } from '../../../components/ui/settings.styles';
import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
export { section, row, headingRow, option, button } from '../../../components/ui/settings.styles';

export const themeSettingsLabelStyle = heading;

export const backupSettingsLabelStyle = heading;

export function settingsScreenScrollViewStyle(theme: Theme) {
  return [layoutStyles.page, { backgroundColor: theme.bg } as const] as const;
}

export const settingsScreenScrollViewContentContainerStyle = content;

export const settingsScreenViewStyle = divider;

export const settingsScreenLabelStyle = {
  fontSize: design.type.caption,
  lineHeight: design.lineHeights.caption,
} as const;

export const settingsScreenLabelStyle2 = { fontSize: design.type.caption } as const;

export const settingsButtonStyle = filledButton;

export function helpButton(theme: Theme) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      width: design.lineHeights.title,
      height: design.lineHeights.title,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: design.radius.small,
      backgroundColor: pressed ? theme.selected : 'transparent',
    }) as const;
}
