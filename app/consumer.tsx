import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Button, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, runTransaction, limit } from 'firebase/firestore';
import { firebaseConfig } from '../FirebaseConfig';
import { HarvestBatch } from './index';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BONUS_AMOUNT = 5;

export default function ConsumerScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // For loading indicator
  const router = useRouter();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setIsProcessing(true); // Show loading spinner
    console.log(`Scanned QR code with data: ${data}`);
    
    if (!data || !data.startsWith('PROD-')) {
        Alert.alert("Invalid QR Code", "This is not a valid AyurChain product code.", [{ text: 'Scan Again', onPress: () => setScanned(false) }]);
        setIsProcessing(false);
        return;
    }
    
    // 1. Find the corresponding harvest batch on the ledger
    const batchIdPrefix = data.split('-')[1];
    if (!batchIdPrefix) {
        Alert.alert("Invalid QR Code", "Product code is malformed.", [{ text: 'Scan Again', onPress: () => setScanned(false) }]);
        setIsProcessing(false); return;
    }

    const batchQuery = query(collection(db, "batches"), where("_id", ">=", batchIdPrefix), where("_id", "<=", batchIdPrefix + '\uf8ff'), limit(1));
    const batchSnap = await getDocs(batchQuery);

    if (batchSnap.empty) {
        Alert.alert('Product Not Found', 'This product could not be found on the ledger.', [{ text: 'Scan Again', onPress: () => setScanned(false) }]);
        setIsProcessing(false); return;
    }

    const batchDocRef = batchSnap.docs[0].ref;
    const harvestData = batchSnap.docs[0].data() as HarvestBatch;
    let bonusAwarded = false;

    // 2. If the harvest was compliant, run a transaction to award the bonus
    if (harvestData.complianceStatus === 'COMPLIANT') {
        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(batchDocRef);
                if (!sfDoc.exists()) { throw "Document does not exist!"; }
                const newBonus = (sfDoc.data().sustainabilityBonus || 0) + BONUS_AMOUNT;
                transaction.update(batchDocRef, { sustainabilityBonus: newBonus });
            });
            console.log("Transaction successfully committed!");
            bonusAwarded = true; // Mark that a bonus was given
        } catch (e) {
            console.error("Transaction failed: ", e);
        }
    }

    // 3. Navigate to the details screen, passing the result
    setIsProcessing(false);
    router.push({ 
        pathname: '/provenance-details', 
        params: { serialId: data, bonusAwarded: bonusAwarded ? 'true' : 'false' } 
    });
  };

  if (!permission) { return <View style={styles.container}><ActivityIndicator size="large" /></View>; }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Camera access is required to scan products.</Text>
        <Button title={'Allow Camera'} onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan Product QR Code' }} />
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point your camera at the QR code</Text>
        <View style={styles.scannerBox} />
        {isProcessing && <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  permissionText: { fontFamily: 'Poppins_400Regular', textAlign: 'center', margin: 20, fontSize: 18, color: 'white' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  overlayText: { fontFamily: 'Poppins_700Bold', color: 'white', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8, position: 'absolute', top: '25%' },
  scannerBox: { width: 280, height: 280, borderWidth: 3, borderColor: 'white', borderRadius: 20 },
});

