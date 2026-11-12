import { layout } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
export { content, divider } from '../../../components/ui/settings.styles';

export function page(theme: Theme) {
  return [layout.page, { backgroundColor: theme.bg } as const] as const;
}
