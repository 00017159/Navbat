import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getCurrentUser, getProfile } from '../../services/api';
import { useTheme } from '../../services/theme';

export default function AdminLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const user = getCurrentUser();
        let role = user?.role;
        if (!role) {
          const profile = await getProfile();
          role = profile?.role;
        }

        if (role === 'ADMIN') {
          setIsAuthorized(true);
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/(tabs)');
      }
    }
    checkAdmin();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerShadowVisible: false }} />
    </Stack>
  );
}
