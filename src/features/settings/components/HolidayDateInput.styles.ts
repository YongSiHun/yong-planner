import { design } from '../../../components/ui/tokens';

export const dateRow = { flexDirection: 'row', gap: design.space.sm } as const;
export const dateField = { flex: 1, minWidth: 0, gap: design.space.xs } as const;
export const yearField = { ...dateField, flex: 2 } as const;
