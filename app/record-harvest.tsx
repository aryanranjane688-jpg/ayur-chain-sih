import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { checkCompliance, getAvailablePlants } from '../complianceRules';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { firebaseConfig } from '../FirebaseConfig';
import { HarvestBatch } from './index';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Predefined Farm & Weather data for simulation
const FARMS = [
  { name: 'Green Valley Organics', notes: 'Harvested from partner farm in Thane West. Certified organic.', latitude: 19.2183, longitude: 72.9781 },
  { name: 'Sunrise Agro Farm', notes: 'Harvested from our cooperative farm near Kalyan. Batch was sun-dried.', latitude: 19.2444, longitude: 73.1330 },
  { name: 'Nature\'s Touch Herbal', notes: 'Sourced from a community-led initiative in Bhiwandi. Fair trade certified.', latitude: 19.2957, longitude: 73.0555 }
];
const WEATHER_CONDITIONS = [
  { temperature: '31°C', condition: 'Sunny' }, { temperature: '29°C', condition: 'Partly Cloudy' },
  { temperature: '28°C', condition: 'Humid' }, { temperature: '30°C', condition: 'Clear Skies' },
];

type PlantName = ReturnType<typeof getAvailablePlants>[number];
type ComplianceStatus = ReturnType<typeof checkCompliance>;

export default function RecordHarvestScreen() {
  const [selectedPlant, setSelectedPlant] = useState<PlantName | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  // This effect runs whenever a new plant is selected
  useEffect(() => {
    const checkLocationAndCompliance = async () => {
        if (!selectedPlant) return;
        setIsChecking(true);
        setComplianceStatus(null); // Reset status on new selection

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Live compliance checks require location access to function.');
            setIsChecking(false);
            return;
        }

        try {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const compliance = checkCompliance(selectedPlant, location.coords);
            setComplianceStatus(compliance);
        } catch (error) {
            Alert.alert("Location Error", "Could not fetch current location. Please ensure GPS is enabled.");
        } finally {
            setIsChecking(false);
        }
    };
    checkLocationAndCompliance();
  }, [selectedPlant]);

  const handleSubmit = async () => {
    if (!complianceStatus?.isCompliant) {
      Alert.alert('Commit Halted', complianceStatus?.message || 'You are not in a compliant zone.');
      return;
    }
    setIsLoading(true);

    const batchesRef = collection(db, "batches");
    const q = query(batchesRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const previousHash = querySnapshot.empty ? "0".repeat(64) : querySnapshot.docs[0].data()._id;

    const randomFarm = FARMS[Math.floor(Math.random() * FARMS.length)];
    const randomWeather = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
    
    // Create the new block, ensuring it matches our HarvestBatch type
    const newBlockData: Omit<HarvestBatch, '_id'> = { 
      botanicalName: selectedPlant!,
      timestamp: new Date().toISOString(),
      previousHash,
      complianceStatus: complianceStatus.status as "COMPLIANT" | "OUT_OF_SEASON" | "PROTECTED_ZONE" | "NO_RULES", // Store the compliance result
      farm: randomFarm,
      weather: randomWeather
    };

    const dataString = JSON.stringify(newBlockData);
    const newHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dataString);

    await addDoc(batchesRef, { _id: newHash, ...newBlockData });
    
    setIsLoading(false);
    
    router.replace({ pathname: '/qr-code', params: { batchId: newHash, botanicalName: selectedPlant! } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Create New Batch' }} />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.label}>1. Select a Plant to Harvest</Text>
        <View style={styles.plantSelector}>
          {getAvailablePlants().map(plant => (
            <TouchableOpacity 
              key={plant} 
              style={[styles.plantButton, selectedPlant === plant && { backgroundColor: '#2a9d8f' }]}
              onPress={() => setSelectedPlant(plant)}
            >
                <Text style={[styles.plantButtonText, selectedPlant === plant && { color: 'white' }]}>{plant}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedPlant && (
            <View style={[styles.statusBanner, { backgroundColor: isChecking ? '#6c757d' : complianceStatus?.color }]}>
                {isChecking ? <ActivityIndicator color="white" /> : <Text style={styles.statusText}>{complianceStatus?.message}</Text>}
            </View>
        )}
        
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isChecking || !complianceStatus?.isCompliant || isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Commit to Live Ledger</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollView: { padding: 20 },
  label: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1C2A3A', marginBottom: 15 },
  plantSelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  plantButton: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', margin: 5 },
  plantButtonText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#2a9d8f' },
  statusBanner: { padding: 15, borderRadius: 10, marginVertical: 20, alignItems: 'center', minHeight: 60, justifyContent: 'center', elevation: 3 },
  statusText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 15, textAlign: 'center' },
  button: { backgroundColor: '#2a9d8f', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 16 },
});

