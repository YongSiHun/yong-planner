import { useEffect } from 'react';
import { AppState, useColorScheme, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { appFonts } from '../components/ui/fonts';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePlanner } from '../stores/planner';
import { Button, Label, ThemeContext, light, dark, useTheme, design } from '../components/ui';

function initializePlanner() {
  void usePlanner
    .getState()
    .initialize()
    .catch(() => {});
}

function usePlannerLifecycle() {
  useEffect(() => {
    initializePlanner();

    const subscription = AppState.addEventListener('change', (state) => {
      const isBackground = state !== 'active';

      if (!isBackground) {
        return;
      }

      void usePlanner
        .getState()
        .flush()
        .catch(() => {});
    });

    return () => subscription.remove();
  }, []);
}

function LoadingScreen() {
  const theme = useTheme();
  const error = usePlanner((state) => state.error);
  const message = error
    ? '데이터를 열지 못했습니다. 기존 데이터는 유지됩니다.'
    : '용플래너를 여는 중…';

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 32, backgroundColor: theme.bg }}>
      <Label>{message}</Label>
      {error ? (
        <>
          <Label muted>{error}</Label>
          <Button title="다시 시도" onPress={initializePlanner} />
        </>
      ) : null}
    </View>
  );
}

function RootNavigation() {
  const theme = useTheme();
  const isReady = usePlanner((state) => state.ready);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.accent,
        headerTitleStyle: {
          fontFamily: design.font.bold,
          fontWeight: 'normal',
          fontSize: design.type.title,
        },
        contentStyle: { backgroundColor: theme.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="recurring" options={{ title: '반복 일정' }} />
      <Stack.Screen name="settings" options={{ title: '설정' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const canShowContent = fontsLoaded || fontError !== null;
  const setting = usePlanner((state) => state.data.settings.theme);
  const systemTheme = useColorScheme();
  const followsSystem = setting === 'system';
  const selectedTheme = followsSystem ? systemTheme : setting;
  const isDarkTheme = selectedTheme === 'dark';
  const theme = isDarkTheme ? dark : light;

  usePlannerLifecycle();

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        {canShowContent ? (
          <RootNavigation />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.bg }} />
        )}
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
