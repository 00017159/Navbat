import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../services/theme';
import { AlertProvider } from '../services/AlertContext';
import { useEffect, useState } from 'react';
import { restoreSession } from '../services/api';

export default function RootLayout() {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => {
      setSessionReady(true);
    });
  }, []);

  if (!sessionReady) return null;

  return (
    <ThemeProvider>
      <AlertProvider>
        <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ headerShown: false }} />
      </Stack>
      </AlertProvider>
    </ThemeProvider>
  );
}
