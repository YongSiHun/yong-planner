import { useEffect } from 'react';
import { AppState, useColorScheme, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePlanner } from '../stores/planner';
import { Button, Label, ThemeContext, light, dark } from '../components/ui';
export default function Layout() {
  const ready = usePlanner((s) => s.ready);
  const error = usePlanner((s) => s.error);
  const setting = usePlanner((s) => s.data.settings.theme);
  const system = useColorScheme();
  const theme = (setting === 'system' ? system : setting) === 'dark' ? dark : light;
  useEffect(() => {
    void usePlanner
      .getState()
      .initialize()
      .catch(() => {});
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        void usePlanner
          .getState()
          .flush()
          .catch(() => {});
    });
    return () => listener.remove();
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar style={theme === dark ? 'light' : 'dark'} />
        {ready ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.bg },
              headerTintColor: theme.text,
              contentStyle: { backgroundColor: theme.bg },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="recurring" options={{ title: '반복 일정' }} />
            <Stack.Screen name="settings" options={{ title: '설정' }} />
          </Stack>
        ) : (
          <View
            style={{ flex: 1, justifyContent: 'center', padding: 32, backgroundColor: theme.bg }}
          >
            <Label>
              {error
                ? '데이터를 열지 못했습니다. 기존 데이터는 유지됩니다.'
                : '용플래너를 여는 중…'}
            </Label>
            {error ? (
              <>
                <Label muted>{error}</Label>
                <Button
                  title="다시 시도"
                  onPress={() => {
                    void usePlanner
                      .getState()
                      .initialize()
                      .catch(() => {});
                  }}
                />
              </>
            ) : null}
          </View>
        )}
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
