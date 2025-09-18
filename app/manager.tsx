import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../FirebaseConfig';
import { HarvestBatch, SupplyChainEvent } from './index';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Reusable UI Components for the Dashboard ---
const MetricCard = ({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: number }) => (
    <View style={styles.metricCard}>
        <MaterialCommunityIcons name={icon} size={32} color="#1C2A3A" />
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

const HerbBreakdownItem = ({ name, count }: { name: string; count: number }) => (
    <View style={styles.breakdownItem}>
        <Text style={styles.breakdownName}>{name}</Text>
        <Text style={styles.breakdownCount}>{count} Batches</Text>
    </View>
);

export default function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<{ batches: HarvestBatch[]; totalBatches: number; herbCounts: Record<string, number> }>({ batches: [], totalBatches: 0, herbCounts: {} });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const q = query(collection(db, "batches"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedBatches = querySnapshot.docs.map(doc => doc.data() as HarvestBatch);

    // --- DATA AGGREGATION LOGIC ---
    const totalBatches = fetchedBatches.length;
    const herbCounts = fetchedBatches.reduce((acc: Record<string, number>, batch) => {
        acc[batch.botanicalName] = (acc[batch.botanicalName] || 0) + 1;
        return acc;
    }, {});

    setDashboardData({ batches: fetchedBatches, totalBatches, herbCounts });
    setIsLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const addSupplyChainEvent = async (batchId: string, type: 'LAB_TEST' | 'MFG_STEP') => {
    const LAB_TESTS = [{ analyst: 'Dr. R. Sharma', result: 'Pass - Heavy Metals OK' }];
    const MFG_STEPS = [{ facility: 'Mumbai Processing Unit', action: 'Dried and Powdered' }];
    
    const eventData = type === 'LAB_TEST' ? LAB_TESTS[0] : MFG_STEPS[0];
    
    await addDoc(collection(db, 'supplyChainEvents'), {
        batchId,
        timestamp: new Date().toISOString(),
        type,
        ...eventData
    } as Omit<SupplyChainEvent, 'id'>);

    Alert.alert('Success', `${type.replace('_', ' ')} event added to the chain for batch ${batchId.substring(0,8)}...`);
  };

  if (isLoading && dashboardData.batches.length === 0) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#1C2A3A" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Intelligence Dashboard' }} />
      <ScrollView>
        <Text style={styles.header}>Live Supply Chain Overview</Text>

        {/* --- Key Metrics Section --- */}
        <View style={styles.metricsContainer}>
            <MetricCard icon="tractor-variant" label="Total Batches on Ledger" value={dashboardData.totalBatches} />
            <MetricCard icon="leaf" label="Unique Herbs Harvested" value={Object.keys(dashboardData.herbCounts).length} />
        </View>

        {/* --- Harvest Breakdown Section --- */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Live Harvest Breakdown</Text>
            {Object.entries(dashboardData.herbCounts).map(([name, count]) => (
                <HerbBreakdownItem key={name} name={name} count={count as number} />
            ))}
        </View>

        {/* --- Recent Activity Feed --- */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity Feed</Text>
            {dashboardData.batches.slice(0, 5).map((item) => ( // Show latest 5
                <View key={item._id} style={styles.activityItem}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>{item.botanicalName}</Text>
                        <Text style={styles.activitySub}>ID: {item._id.substring(0, 16)}...</Text>
                    </View>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={() => addSupplyChainEvent(item._id, 'LAB_TEST')}>
                            <FontAwesome5 name="vial" size={14} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#e76f51' }]} onPress={() => addSupplyChainEvent(item._id, 'MFG_STEP')}>
                            <FontAwesome5 name="industry" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontFamily: 'Poppins_700Bold', fontSize: 22, margin: 20, textAlign: 'center', color: '#1C2A3A' },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16 },
  metricCard: { flex: 1, backgroundColor: 'white', borderRadius: 15, padding: 15, alignItems: 'center', marginHorizontal: 8, elevation: 3 },
  metricValue: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#1C2A3A', marginTop: 8 },
  metricLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray', marginTop: 2, textAlign: 'center' },
  card: { backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 20 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1C2A3A', marginBottom: 15 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  breakdownName: { fontFamily: 'Poppins_400Regular', fontSize: 16 },
  breakdownCount: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  activityTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  activitySub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray' },
  buttonRow: { flexDirection: 'row' },
  button: { backgroundColor: '#264653', padding: 10, borderRadius: 8, marginLeft: 10 },
});

