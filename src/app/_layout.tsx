import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as styles from '../components/navigation/RootLayout.styles';
import { Button, dark, Label, light, ThemeContext, useTheme } from '../components/ui';
import { DialogHost } from '../components/ui/DialogHost';
import { appFonts } from '../components/ui/fonts';
import { usePlannerActions } from '../features/planner/hooks/usePlannerActions';
import { usePlannerInit } from '../features/planner/hooks/usePlannerInit';
import { usePlanner } from '../stores/planner';

function LoadingScreen() {
  const { initialize } = usePlannerActions();
  const theme = useTheme();
  const error = usePlanner((state) => state.error);
  const message = error
    ? '데이터를 열지 못했습니다. 기존 데이터는 유지됩니다.'
    : '용플래너를 여는 중…';

  return (
    <View style={styles.loadingScreenViewStyle(theme)}>
      <Label>{message}</Label>
      {error ? (
        <>
          <Label muted>{error}</Label>
          <Button
            title="다시 시도"
            onPress={() => {
              void initialize().catch(() => {});
            }}
          />
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
    <Stack screenOptions={styles.rootNavigationStackScreenOptions(theme)}>
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
  const isDarkTheme = usesDarkTheme(setting, systemTheme);
  const theme = isDarkTheme ? dark : light;

  usePlannerInit();

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar style={styles.rootLayoutStatusBarStyle(isDarkTheme)} />
        {canShowContent ? <RootNavigation /> : <View style={styles.rootLayoutViewStyle(theme)} />}
        <DialogHost />
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

function usesDarkTheme(setting: string, systemTheme: string | null | undefined): boolean {
  const selectedTheme = setting === 'system' ? systemTheme : setting;

  return selectedTheme === 'dark';
}
