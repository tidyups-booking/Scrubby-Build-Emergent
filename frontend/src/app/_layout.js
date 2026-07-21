import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { COLORS } from '../constants/theme';
import { BusinessProvider } from '../lib/business';
import { useLeadAlerts } from '../lib/leadAlerts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useLeadAlerts();
  const [loaded] = useFonts({
    Sora_700Bold,
    Sora_800ExtraBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <BusinessProvider>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin" options={{ presentation: 'modal' }} />
          <Stack.Screen name="cleaner" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
    </BusinessProvider>
  );
}
