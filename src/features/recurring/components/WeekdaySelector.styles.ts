import { design } from '../../../components/ui/tokens';

export const weekdays = { flexDirection: 'row', gap: design.space.xs, width: '100%' } as const;
export const weekday = { flex: 1, minWidth: 0, paddingHorizontal: 0 } as const;
