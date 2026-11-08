import { design } from '../../../components/ui/tokens';

export const emptyPreview = {
  minHeight: design.rowMinHeight,
  justifyContent: 'center',
  paddingVertical: 7,
} as const;

export const preview = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  paddingVertical: 4,
  minHeight: design.rowMinHeight,
} as const;

export function chipWrapper(draggingIndex: number | null | undefined, index: number) {
  return { maxWidth: '100%', flexShrink: 1, opacity: draggingIndex === index ? 0.35 : 1 } as const;
}
