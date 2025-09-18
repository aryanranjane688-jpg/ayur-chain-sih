import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

const generateSerialIds = (batchId: string, count: number) => {
    const products = [];
    for (let i = 1; i <= count; i++) {
        products.push({ serialId: `PROD-${batchId.substring(0, 8)}-${i.toString().padStart(4, '0')}` });
    }
    return products;
};

const ProductQrCard = ({ serialId, botanicalName }: { serialId: string; botanicalName: string }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{botanicalName}</Text>
        <View style={styles.qrContainer}><QRCode value={serialId} size={180} /></View>
        <Text style={styles.serialIdText}>Serial ID: {serialId}</Text>
    </View>
);

export default function QrCodeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { batchId, botanicalName } = params;

  if (!batchId || !botanicalName) return null;

  const finishedProducts = generateSerialIds(batchId as string,10);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Production Complete!' }} />
      <Text style={styles.header}>Batch Committed</Text>
      <Text style={styles.subtitle}>The following serialized products have been generated from this batch. Scan any QR code to test.</Text>
      <ScrollView>
        {finishedProducts.map(p => <ProductQrCard key={p.serialId} {...p} botanicalName={botanicalName as string} />)}
      </ScrollView>
       <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/farmer')}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F9' },
    header: { fontFamily: 'Poppins_700Bold', fontSize: 24, textAlign: 'center', color: '#1C2A3A', marginTop: 20 },
    subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center', color: 'gray', marginVertical: 10, paddingHorizontal: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, margin: 10, alignItems: 'center', elevation: 4 },
    cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 15 },
    qrContainer: { padding: 10, backgroundColor: 'white', borderRadius: 10 },
    serialIdText: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 12, marginTop: 15, color: '#555' },
    doneButton: { backgroundColor: '#2a9d8f', padding: 15, margin: 20, borderRadius: 12, alignItems: 'center' },
    doneButtonText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 16 },
});
