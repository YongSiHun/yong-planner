import { StyleSheet } from 'react-native';
export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  page: { flex: 1, paddingHorizontal: 20, width: '100%', maxWidth: 800, alignSelf: 'center' },
});
