import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Button } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ConsumerScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  // 2. This function is called when a QR code is successfully scanned
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true); // Stop scanning to prevent multiple scans
    console.log(`Scanned QR code with data: ${data}`);
    
    // 3. Validate that it's a valid AyurChain product code
    if (data && data.startsWith('PROD-')) {
        // If valid, pass the unique serialId to the next screen to fetch its history
        router.push({ pathname: '/provenance-details', params: { serialId: data } });
    } else {
        // If it's not a valid code, show an alert
        Alert.alert(
            "Invalid QR Code", 
            "This is not a valid AyurChain product code. Please scan an authentic product.", 
            [{ text: 'Scan Again', onPress: () => setScanned(false) }] // Allow the user to try again
        );
    }
  };

  // --- UI Rendering based on permission status ---
  if (!permission) {
    return <View style={styles.container}><Text style={styles.permissionText}>Requesting camera permission...</Text></View>;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Camera Permission' }} />
        <Text style={styles.permissionText}>Camera access is required to scan products.</Text>
        <Button title={'Allow Camera'} onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan Product QR Code' }} />
      {/* Use the CameraView component for scanning */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point your camera at the QR code</Text>
        <View style={styles.scannerBox} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'black' 
  },
  permissionText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    margin: 20,
    fontSize: 18,
    color: 'white',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayText: {
    fontFamily: 'Poppins_700Bold',
    color: 'white',
    fontSize: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    position: 'absolute',
    top: '25%',
  },
  scannerBox: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 20,
  },
});

