import { StyleSheet } from 'react-native';
import { design } from './tokens';

export const layout = StyleSheet.create({
  surface: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: design.space.sm, flexWrap: 'wrap' },
  page: { flex: 1, width: '100%', maxWidth: design.layout.contentMaxWidth, alignSelf: 'center' },
  pageContent: {
    padding: design.layout.pagePadding,
    paddingBottom: design.layout.bottomSpace,
    gap: design.layout.pageGap,
  },
  section: { width: '100%', gap: design.space.sm },
  textAction: { alignItems: 'flex-start', paddingHorizontal: 0 },
});
