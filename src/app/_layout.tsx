import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../services/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
