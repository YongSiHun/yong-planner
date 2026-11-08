import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const deleteSchedulesViewStyle = { flexDirection: 'row', gap: design.space.sm } as const;

export const deleteSchedulesButtonStyle = { flex: 1 } as const;

export function deleteSchedulesButtonStyle2(theme: Theme) {
  return { flex: 1, backgroundColor: theme.red } as const;
}
