import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Poppins_400Regular, Poppins_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
            headerStyle: {
                backgroundColor: '#1C2A3A', // Dark Navy
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontFamily: 'Poppins_700Bold',
            },
        }}
      />
    </>
  );
}
