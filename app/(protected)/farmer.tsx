import { FontAwesome5 } from '@expo/vector-icons';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { firebaseConfig } from '../../FirebaseConfig';
import { HarvestBatch } from '.././index';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- NEW COMPONENT: The Earnings Card ---
// This is the centerpiece of the dashboard, showing the live total.
const EarningsCard = ({ totalEarnings }: { totalEarnings: number }) => (
    <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total Sustainability Bonus Earned</Text>
        <Text style={styles.earningsAmount}>₹{totalEarnings.toFixed(2)}</Text>
        <Text style={styles.earningsSubtext}>This is a live total of bonuses from consumer scans of your compliant products.</Text>
    </View>
);

// --- MODIFIED COMPONENT: BatchItem now shows individual bonus ---
// This provides granular feedback on which batches are earning rewards.
const BatchItem = ({ item, onPress }: { item: HarvestBatch; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.botanicalName}</Text>
            {/* Conditionally render the bonus chip only if a bonus has been earned */}
            {(item.sustainabilityBonus || 0) > 0 && (
                <View style={styles.bonusChip}>
                    <FontAwesome5 name="leaf" size={12} color="#2a9d8f" />
                    <Text style={styles.bonusText}>+ ₹{item.sustainabilityBonus.toFixed(2)}</Text>
                </View>
            )}
        </View>
        <Text style={styles.itemSubtitle}>Batch ID: {item._id.substring(0, 16)}...</Text>
        <Text style={styles.itemDate}>Recorded: {new Date(item.timestamp).toLocaleDateString()}</Text>
    </View>
  </TouchableOpacity>
);

export default function FarmerDashboardScreen() {
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchBatches = async () => {
    setIsLoading(true);
    const q = query(collection(db, "batches"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedBatches = querySnapshot.docs.map(doc => doc.data() as HarvestBatch);
    
    // Calculate total earnings from all fetched batches
    const total = fetchedBatches.reduce((sum, batch) => sum + (batch.sustainabilityBonus || 0), 0);
    
    setTotalEarnings(total);
    setBatches(fetchedBatches);
    setIsLoading(false);
  };

  // useFocusEffect ensures data is fresh every single time the screen is viewed
  useFocusEffect(useCallback(() => { fetchBatches(); }, []));

  const handleViewQr = (batch: HarvestBatch) => {
    router.push({ pathname: '/qr-code', params: { batchId: batch._id, botanicalName: batch.botanicalName } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Producer Dashboard' }} />
      <FlatList
        data={batches}
        renderItem={({ item }) => <BatchItem item={item} onPress={() => handleViewQr(item)} />}
        keyExtractor={(item) => item._id}
        // The EarningsCard is the main header for our list
        ListHeaderComponent={<EarningsCard totalEarnings={totalEarnings} />}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                {!isLoading && <Text style={styles.emptyText}>No harvests on the ledger. Tap '+' to begin.</Text>}
            </View>
        }
        onRefresh={fetchBatches}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Link href="/record-harvest" asChild>
        <TouchableOpacity style={styles.fab}><Text style={styles.fabText}>+</Text></TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  earningsCard: { 
    backgroundColor: '#1C2A3A', 
    padding: 25, 
    margin: 16, 
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  earningsLabel: { fontFamily: 'Poppins_400Regular', color: '#a8dadc', fontSize: 14 },
  earningsAmount: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 40, marginTop: 5 },
  earningsSubtext: { fontFamily: 'Poppins_400Regular', color: '#6c757d', fontSize: 12, marginTop: 10, textAlign: 'center' },
  itemContainer: { 
    backgroundColor: 'white', 
    padding: 20, 
    marginVertical: 8, 
    marginHorizontal: 16, 
    borderRadius: 15, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1C2A3A', flex: 1 },
  bonusChip: { flexDirection: 'row', backgroundColor: '#e0f2f1', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center' },
  bonusText: { fontFamily: 'Poppins_700Bold', color: '#2a9d8f', fontSize: 14, marginLeft: 5 },
  itemSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray', marginVertical: 1 },
  itemDate: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray', marginTop: 5 },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center'
  },
  emptyText: { 
    color: 'gray', 
    fontFamily: 'Poppins_400Regular',
    fontSize: 16
  },
  fab: { position: 'absolute', right: 30, bottom: 30, backgroundColor: '#2a9d8f', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { fontSize: 30, color: 'white' },
});

