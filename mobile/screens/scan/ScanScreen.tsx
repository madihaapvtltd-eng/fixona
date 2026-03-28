import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    
    try {
      // Try to parse as asset ID or work order ID
      const assetRef = doc(db, 'assets', data);
      const assetSnap = await getDoc(assetRef);
      
      if (assetSnap.exists()) {
        Alert.alert(
          'Asset Found',
          `Asset: ${assetSnap.data().name}`,
          [
            { text: 'View Details', onPress: () => console.log('View asset', data) },
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
      } else {
        // Check if it's a work order
        const woRef = doc(db, 'work_orders', data);
        const woSnap = await getDoc(woRef);
        
        if (woSnap.exists()) {
          navigation.navigate('TaskDetail' as never, { id: data } as never);
        } else {
          Alert.alert('Not Found', 'No matching asset or work order found');
          setScanned(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup QR code');
      setScanned(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      
      <Text style={styles.instructions}>
        Scan asset QR code or work order barcode
      </Text>
      
      {scanned && (
        <Button
          title="Scan Again"
          onPress={() => setScanned(false)}
          containerStyle={styles.scanAgain}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  scanAgain: {
    position: 'absolute',
    bottom: 40,
    width: 200,
  },
});
