import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../FirebaseConfig';
import { HarvestBatch } from './index';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LAB_TESTS = [{ analyst: 'Dr. R. Sharma', result: 'Pass - Heavy Metals OK' }];
const MFG_STEPS = [{ facility: 'Mumbai Processing Unit', action: 'Dried and Powdered' }];

export default function ManagerDashboard() {
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = async () => {
    setIsLoading(true);
    const q = query(collection(db, "batches"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedBatches = querySnapshot.docs.map(doc => doc.data() as HarvestBatch);
    setBatches(fetchedBatches);
    setIsLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchBatches(); }, []));

  const addSupplyChainEvent = async (batchId: string, type: 'LAB_TEST' | 'MFG_STEP') => {
    const eventData = type === 'LAB_TEST' ? LAB_TESTS[0] : MFG_STEPS[0];
    await addDoc(collection(db, 'supplyChainEvents'), {
        batchId: batchId,
        timestamp: new Date().toISOString(),
        type,
        ...eventData
    });
    Alert.alert('Success', `${type.replace('_', ' ')} event added to the chain for batch ${batchId.substring(0,8)}...`);
  };

  if (isLoading && batches.length === 0) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Supply Chain Overview' }} />
      <FlatList
        data={batches}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.botanicalName}</Text>
                <Text style={styles.cardSub}>Batch ID: {item._id.substring(0, 16)}...</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.button, {backgroundColor: '#264653'}]} onPress={() => addSupplyChainEvent(item._id, 'LAB_TEST')}>
                        <Text style={styles.buttonText}>Add Lab Test</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor: '#e76f51'}]} onPress={() => addSupplyChainEvent(item._id, 'MFG_STEP')}>
                        <Text style={styles.buttonText}>Add Mfg Step</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
        onRefresh={fetchBatches}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F9' },
    card: { backgroundColor: 'white', padding: 15, marginHorizontal: 16, marginVertical: 8, borderRadius: 10, elevation: 3 },
    cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
    cardSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray', marginVertical: 5 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
    button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    buttonText: { color: 'white', fontFamily: 'Poppins'
    }
}); 