import Feather from '@expo/vector-icons/Feather';
import { Pressable, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Label, useTheme } from '../../../components/ui';
import { monthLabel } from '../../../utils/date';
import { usePlannerSearch } from '../hooks/usePlannerSearch';
import { useSearchNavigation } from '../hooks/useSearchNavigation';
import type { SearchResult } from '../services/search';
import * as styles from './SearchScreen.styles';

export default function SearchScreen() {
  const theme = useTheme();
  const state = usePlannerSearch();
  const { openResult } = useSearchNavigation();

  return (
    <SafeAreaView style={styles.screen(theme)} edges={['left', 'right', 'bottom']}>
      <View style={styles.frame}>
        <View style={styles.searchBox}>
          <Input
            autoFocus
            accessibilityLabel="일정 검색어"
            placeholder="모든 달의 일정 검색"
            value={state.query}
            onChangeText={state.setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <SectionList
          sections={state.sections}
          keyExtractor={(result) => result.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <Label style={styles.month(theme)}>{monthLabel(`${section.month}-01`)}</Label>
          )}
          renderItem={({ item }) => <ResultRow result={item} onPress={() => openResult(item)} />}
          ListEmptyComponent={<SearchEmpty hasQuery={state.hasQuery} searching={state.searching} />}
        />
      </View>
    </SafeAreaView>
  );
}

function ResultRow({ result, onPress }: { result: SearchResult; onPress(): void }) {
  const theme = useTheme();
  const isSeries = result.kind === 'recurring';
  const date = isSeries ? `반복 · ${result.date} ~ ${result.endDate ?? '계속'}` : result.date;
  const time = result.time ? ` · ${result.time}` : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date}${time} ${result.content}`}
      onPress={onPress}
      style={styles.result(theme)}
    >
      <View style={styles.resultContent}>
        <Label muted style={styles.date}>
          {date}
          {time}
        </Label>
        <Text numberOfLines={3} style={styles.content(theme)}>
          {result.content}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.muted} />
    </Pressable>
  );
}

function SearchEmpty({ hasQuery, searching }: { hasQuery: boolean; searching: boolean }) {
  const theme = useTheme();
  const message = hasQuery ? '검색 결과가 없어요.' : '찾고 싶은 일정을 입력하세요.';

  return (
    <View style={styles.empty}>
      <Feather name="search" size={36} color={theme.muted} />
      <Label muted>{searching ? '검색 중…' : message}</Label>
    </View>
  );
}
