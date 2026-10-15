import { Newsreader_400Regular, Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { DB_NAME, getSettings, logDbStatus, migrate } from '@/db';
import { usePalette } from '@/hooks/use-palette';
import { fonts, night } from '@/theme';

SplashScreen.preventAutoHideAsync();

async function initDb(db: SQLiteDatabase) {
  await migrate(db);
  await getSettings(db);
  if (__DEV__) await logDbStatus(db);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.serif]: Newsreader_400Regular,
    [fonts.serifItalic]: Newsreader_400Regular_Italic,
    [fonts.sans]: Nunito_400Regular,
    [fonts.sansBold]: Nunito_700Bold,
  });
  const palette = usePalette();
  const isNight = palette === night;

  const navTheme = useMemo<Theme>(() => {
    const base = isNight ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.background,
        card: palette.nav,
        text: palette.text,
        border: palette.border,
      },
    };
  }, [palette, isNight]);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={isNight ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="talking" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="read" />
          <Stack.Screen name="crisis" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="night/[id]" />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
