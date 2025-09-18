import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, limit, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { firebaseConfig } from '../FirebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email) {
            Alert.alert("Input Required", "Please enter your email address.");
            return;
        }
        setIsLoading(true);

        try {
            const q = query(collection(db, "applications"), where("email", "==", email.trim().toLowerCase()), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert("Login Failed", "This email is not registered.");
                setIsLoading(false);
                return;
            }

            const applicantDoc = querySnapshot.docs[0].data();

            if (applicantDoc.status !== 'APPROVED') {
                Alert.alert("Login Failed", "Your application has not been approved by an NMPB admin yet.");
                setIsLoading(false);
                return;
            }

            // --- THE NEW LOGIC ---
            // 1. Create the user session object
            const userSession = {
                email: applicantDoc.email,
                fullName: applicantDoc.fullName,
            };

            // 2. Save the session directly to the phone's storage
            await AsyncStorage.setItem('userSession', JSON.stringify(userSession));
            console.log("User session saved for:", userSession.fullName);

            // 3. Navigate the user into the protected zone
            router.replace('/farmer');

        } catch (error) {
            console.error("Login error:", error);
            Alert.alert("Error", "An error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Producer Login' }} />
            <Text style={styles.title}>Producer Portal</Text>
            <Text style={styles.subtitle}>Enter the email associated with your approved application.</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F4F7F9' },
    title: { fontFamily: 'Poppins_700Bold', fontSize: 28, textAlign: 'center', marginBottom: 10, color: '#1C2A3A' },
    subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, textAlign: 'center', marginBottom: 40, color: 'gray' },
    input: { fontFamily: 'Poppins_400Regular', backgroundColor: 'white', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: '#2a9d8f', padding: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 16 },
});

