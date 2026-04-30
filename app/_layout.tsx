import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppThemeProvider, colors } from '@/src/theme';
import { DemoStateProvider } from '@/src/state/DemoStateProvider';
import { AuthRedirect } from '@/src/navigation/AuthRedirect';
import { WorkspaceProvider } from '@/src/state/WorkspaceProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg.canvas,
      card: colors.card.surface,
      border: colors.border.subtle,
      text: colors.text.primary,
      primary: colors.brand.forest,
      notification: colors.brand.forestSoft,
    },
  } as const;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WorkspaceProvider>
        <AuthRedirect />
        <DemoStateProvider>
          <AppThemeProvider>
            <ThemeProvider value={navigationTheme}>
              <StatusBar style="light" />
              {/* File-based routes are registered automatically; only override screens that need special options. */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade_from_bottom',
                  animationDuration: 140,
                  gestureEnabled: true,
                }}>
                <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
              </Stack>
            </ThemeProvider>
          </AppThemeProvider>
        </DemoStateProvider>
      </WorkspaceProvider>
    </GestureHandlerRootView>
  );
}
