export const field = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
  paddingVertical: 4,
} as const;

// Visual line boundary only; the schedule text and chip identities stay unchanged.
export const editorBreak = {
  flexBasis: '100%',
  height: 0,
  flexGrow: 0,
  flexShrink: 0,
} as const;
