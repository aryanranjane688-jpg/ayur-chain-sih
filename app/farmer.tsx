import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../FirebaseConfig';
import { HarvestBatch } from './index';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface BatchItemProps {
  item: HarvestBatch;
  onPress: () => void;
}

const BatchItem: React.FC<BatchItemProps> = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.botanicalName}</Text>
      <Text style={styles.itemSubtitle}>Batch ID: {item._id.substring(0, 16)}...</Text>
      <Text style={styles.itemDate}>Recorded: {new Date(item.timestamp).toLocaleDateString()}</Text>
    </View>
  </TouchableOpacity>
);

export default function FarmerDashboardScreen() {
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchBatches = async () => {
    setIsLoading(true);
    const q = query(collection(db, "batches"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedBatches = querySnapshot.docs.map(doc => doc.data() as HarvestBatch);
    setBatches(fetchedBatches);
    setIsLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchBatches(); }, []));

  const handleViewQr = (batch: HarvestBatch) => {
    router.push({ pathname: '/qr-code', params: { batchId: batch._id, botanicalName: batch.botanicalName } });
  };

  if (isLoading && batches.length === 0) return <ActivityIndicator size="large" style={{ flex: 1, backgroundColor: '#F4F7F9' }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Your Harvests' }} />
      <FlatList
        data={batches}
        renderItem={({ item }) => <BatchItem item={item} onPress={() => handleViewQr(item)} />}
        keyExtractor={(item: HarvestBatch) => item._id}
        ListHeaderComponent={<Text style={styles.header}>Live Harvest Ledger</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No harvests on the ledger. Tap '+' to begin.</Text>}
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
  header: { fontFamily: 'Poppins_700Bold', fontSize: 22, margin: 20, textAlign: 'center', color: '#1C2A3A' },
  itemContainer: { backgroundColor: 'white', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 10, elevation: 3 },
  itemTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#2a9d8f' },
  itemSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray', marginVertical: 2 },
  itemDate: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'gray' },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontFamily: 'Poppins_400Regular' },
  fab: { position: 'absolute', right: 30, bottom: 30, backgroundColor: '#2a9d8f', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { fontSize: 30, color: 'white' },
});

