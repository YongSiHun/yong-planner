import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label, useTheme } from '../../../components/ui';
import { NotesHeader } from '../components/NotesHeader';
import { MemoEditor } from '../components/MemoEditor';
import { MemoList } from '../components/MemoList';
import { MemoEditorMenu } from '../components/MemoEditorMenu';
import { MemoListMenu } from '../components/MemoListMenu';
import { useMemoState } from '../hooks/useMemoState';
import { useMemoBack } from '../hooks/useMemoBack';
import { useMemoRoute } from '../hooks/useMemoRoute';
import type { MemoState } from '../types/presentation';
import * as styles from './NotesScreen.styles';

export default function NotesScreen() {
  const theme = useTheme();
  const state = useMemoState();
  const editorOpen = state.editing !== undefined;

  useMemoBack(state);
  useMemoRoute(state);

  return (
    <SafeAreaView style={styles.screen(theme)} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.frame}>
        <NotesNavigation state={state} />
        <NotesHeader state={state} />
        <MemoEditorMenu state={state} />
        <MemoListMenu state={state} />
        {state.trashOpen ? (
          <Label muted style={styles.notice}>
            휴지통의 메모는 삭제 후 30일 동안 보관되며 복구할 수 있어요.
          </Label>
        ) : null}
        {state.error ? <Label style={styles.notice}>{state.error}</Label> : null}
        {editorOpen ? <MemoEditor state={state} /> : <MemoList state={state} />}
      </View>
    </SafeAreaView>
  );
}

function NotesNavigation({ state }: { state: MemoState }) {
  const editorOpen = state.editing !== undefined;

  return (
    <Stack.Screen
      options={{
        title: '메모',
        gestureEnabled: !editorOpen && !state.selecting,
        headerShown: false,
      }}
    />
  );
}
