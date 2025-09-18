import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firebaseConfig } from '../FirebaseConfig';
import { FullHistory, HarvestBatch, SupplyChainEvent } from './index';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- TYPE DEFINITIONS FOR PROPS ---
type DetailRowProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    value: string;
};

type TimelineItemProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    title: string;
    subtitle: string;
    isLast?: boolean;
};

// --- REUSABLE UI COMPONENTS ---
const TimelineItem: React.FC<TimelineItemProps> = ({ icon, color, title, subtitle, isLast = false }) => (
    <View style={styles.timelineItemContainer}>
        <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: color }]} />}
        <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>{title}</Text>
            <Text style={styles.timelineSubtitle}>{subtitle}</Text>
        </View>
    </View>
);

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
        <MaterialCommunityIcons name={icon} size={28} color="#1C2A3A" />
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

// --- MAIN SCREEN COMPONENT ---
export default function ProvenanceScreen() {
  const [fullHistory, setFullHistory] = useState<FullHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useLocalSearchParams<{ serialId: string }>();

  useEffect(() => {
    const fetchFullHistory = async () => {
        if (!params.serialId) {
            setIsLoading(false);
            return;
        }

        // 1. Extract the Batch ID from the Serial ID
        // PROD-<8 chars of hash>-0001 -> <8 chars of hash>
        const batchIdPrefix = params.serialId.split('-')[1];
        if (!batchIdPrefix) {
            setIsLoading(false);
            return;
        }
        
        // 2. Find the full Batch ID (hash) from the 'batches' collection
        const batchQuery = query(collection(db, "batches"), where("_id", ">=", batchIdPrefix), where("_id", "<=", batchIdPrefix + '\uf8ff'), limit(1));
        const batchSnap = await getDocs(batchQuery);

        if (batchSnap.empty) {
            setIsLoading(false);
            return;
        }
        const batchDoc = batchSnap.docs[0];
        const harvestData = batchDoc.data() as HarvestBatch;
        
        // 3. Fetch all subsequent events for this batch
        const eventsQuery = query(collection(db, "supplyChainEvents"), where("batchId", "==", harvestData._id), orderBy("timestamp", "asc"));
        const eventsSnap = await getDocs(eventsQuery);
        const chainEvents = eventsSnap.docs.map(doc => doc.data() as SupplyChainEvent);

        setFullHistory({ harvest: harvestData, events: chainEvents });
        setIsLoading(false);
    };
    fetchFullHistory();
  }, [params]);
  
  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!fullHistory) {
    return <SafeAreaView style={styles.container}><Text style={styles.emptyText}>Product not found on the ledger.</Text></SafeAreaView>;
  }

  const { harvest, events } = fullHistory;

  const openMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${harvest.farm.latitude},${harvest.farm.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Product History' }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <FontAwesome5 name="check-circle" size={40} color="#2a9d8f" />
          <Text style={styles.verifiedText}>Product Verified</Text>
          <Text style={styles.botanicalName}>{harvest.botanicalName}</Text>
        </View>
        
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Harvest Conditions</Text>
            <View style={styles.detailsGrid}>
                <DetailRow icon="thermometer" label="Temperature" value={harvest.weather.temperature} />
                <DetailRow icon="weather-cloudy" label="Weather" value={harvest.weather.condition} />
                <DetailRow icon="calendar-month" label="Date" value={new Date(harvest.timestamp).toLocaleDateString()} />
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={openMap}>
                <MaterialCommunityIcons name="map-marker" size={20} color="white" />
                <Text style={styles.mapButtonText}>View Harvest Location on Map</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Supply Chain Journey</Text>
            <TimelineItem icon="leaf" color="#2a9d8f" title="Harvested by Producer" subtitle={harvest.farm.notes} />
            {events.map((event: SupplyChainEvent, index: number) => {
                if (event.type === 'LAB_TEST') {
                    return <TimelineItem key={index} icon="test-tube" color="#264653" title="Quality Control Check" subtitle={`Checked by ${event.analyst}. Result: ${event.result}`} />
                }
                if (event.type === 'MFG_STEP') {
                    return <TimelineItem key={index} icon="factory" color="#f4a261" title="Manufacturing Step" subtitle={`${event.action} at ${event.facility}`} />
                }
                return null;
            })}
             <TimelineItem icon="pound" color="#a8dadc" title="Cryptographic Proof" subtitle={`Batch Hash: ${harvest._id.substring(0,16)}...\nPrevious Hash: ${harvest.previousHash.substring(0,16)}...`} isLast={true} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContainer: { paddingBottom: 20 },
  headerContainer: { paddingVertical: 30, alignItems: 'center', backgroundColor: 'white' },
  verifiedText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1C2A3A', marginTop: 15 },
  botanicalName: { fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#333', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 20 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, marginBottom: 15, color: '#1C2A3A' },
  detailsGrid: { marginBottom: 10 },
  detailItem: { flexDirection: 'column', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'gray', marginTop: 8 },
  detailValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1C2A3A', marginTop: 2, textAlign: 'center' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e76f51', padding: 15, borderRadius: 12, marginTop: 20 },
  mapButtonText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 16, marginLeft: 10 },
  timelineItemContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { width: 50, alignItems: 'center' },
  timelineLine: { width: 2, position: 'absolute', left: 24, top: 40, bottom: -20 },
  timelineContent: { flex: 1, paddingBottom: 30 },
  timelineTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#333' },
  timelineSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'gray', marginTop: 4 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 50 },
});

