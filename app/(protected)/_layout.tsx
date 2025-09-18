import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// This layout is the "brain" and the "gatekeeper" for all producer-only screens.
export default function ProtectedLayout() {
  // We use a state to track the session status:
  // undefined = we are currently checking
  // null = no session found
  // string = session exists
  const [session, setSession] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const checkSession = async () => {
      const userSession = await AsyncStorage.getItem('userSession');
      setSession(userSession);
    };
    checkSession();
  }, []);

  // 1. Show a loading spinner while we check for a user session.
  if (session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1C2A3A" />
      </View>
    );
  }

  // 2. If, after checking, there is no session, redirect to the login screen.
  if (session === null) {
    return <Redirect href="/login" />;
  }

  // 3. If a session string exists, the user is logged in. Show the content.
  // We use a Stack navigator here so screens within the protected zone can navigate
  // between each other (e.g., from the dashboard to the record harvest screen).
  return <Stack screenOptions={{ headerShown: false }} />;
}

