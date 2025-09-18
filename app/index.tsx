import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';




const RoleCard = ({ href, iconName, title, description, color }: { href: any; iconName: string; title: string; description: string; color: string }) => (
    <Link href={href} asChild>
    <TouchableOpacity style={styles.card}>
        <FontAwesome5 name={iconName} size={40} color={color} />
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
</Link>
);

export default function RoleSelectionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.title}>AyurChain</Text>
        <Text style={styles.subtitle}>A Live, End-to-End Traceability Ledger</Text>
      </View>
      <RoleCard href="/farmer" iconName="tractor" title="Producer" description="Commit a new harvest to the live ledger and generate its unique identity." color="#2a9d8f" />
      <RoleCard href="/manager" iconName="tasks" title="Manager" description="View all batches and add supply chain events like testing and processing." color="#f4a261" />
      <RoleCard href="/consumer" iconName="qrcode" title="Consumer" description="Scan a product to verify its origin and view its full, immutable history." color="#e76f51" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F9' },
  header: { position: 'absolute', top: 120, alignItems: 'center' },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 42, color: '#1C2A3A' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: 'gray', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  card: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center', marginVertical: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, marginTop: 15 },
  cardDescription: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
});

export interface HarvestBatch {
    _id: string; // The SHA256 hash of the block
    botanicalName: string;
    timestamp: string;
    previousHash: string;
    complianceStatus: 'COMPLIANT' | 'OUT_OF_SEASON' | 'PROTECTED_ZONE' | 'NO_RULES';
    farm: {
      name: string;
      notes: string;
      latitude: number;
      longitude: number;
    };
    weather: {
      temperature: string;
      condition: string;
    };
  }
  
  // The structure for subsequent events in the 'supplyChainEvents' collection
  export interface SupplyChainEvent {
    batchId: string;
    timestamp: string;
    type: 'LAB_TEST' | 'MFG_STEP';
    analyst?: string;
    result?: string;
    facility?: string;
    action?: string;
  }
  
  // A combined object for the final provenance screen
  export interface FullHistory {
    harvest: HarvestBatch;
    events: SupplyChainEvent[];
  }