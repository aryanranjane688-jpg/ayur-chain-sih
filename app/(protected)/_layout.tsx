import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// This layout is the "brain" and the "gatekeeper" for all producer-only screens.
export default function ProtectedLayout() {
  // We use a state to track the session status:
  // undefined = we are currently checking
  // null = no session found
  // string = session exists
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const navigation = useNavigation();

  // --- NEW, MORE ROBUST LOGIC ---
  // useFocusEffect runs every time a screen inside this layout comes into focus.
  // This guarantees we re-check the session on every visit to the protected zone.
  useFocusEffect(
    useCallback(() => {
      const checkSession = async () => {
        const userSession = await AsyncStorage.getItem('userSession');
        setSession(userSession);
      };
      checkSession();
    }, [])
  );

  // This effect listens for navigation events to reliably clear the session upon exiting.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // The 'beforeRemove' event fires whenever the user tries to navigate away
      // from any screen within this protected layout (e.g., by pressing the back button).
      
      // We don't prevent the navigation, we just use it as a trigger to clear storage.
      console.log("Leaving protected zone, clearing session.");
      AsyncStorage.removeItem('userSession');
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, [navigation]);

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

