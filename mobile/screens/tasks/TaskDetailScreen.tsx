import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Input, Card, ListItem, Badge } from '@rneui/themed';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: any;
  assetId: string;
  assetName: string;
}

export function TaskDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  const { isOnline, queueAction } = useOffline();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const fetchWorkOrder = async () => {
    try {
      const docRef = doc(db, 'work_orders', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setWorkOrder({ id: snap.id, ...snap.data() } as WorkOrder);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to load task' });
    }
  };

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      if (isOnline) {
        await updateDoc(doc(db, 'work_orders', id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
          ...(newStatus === 'in_progress' ? { startedAt: serverTimestamp() } : {}),
          ...(newStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
        });
      } else {
        // Queue for offline sync
        queueAction({
          id: `${id}_${Date.now()}`,
          type: 'update_work_order',
          data: { id, status: newStatus },
          timestamp: Date.now(),
        });
      }
      
      Toast.show({ type: 'success', text1: `Status updated to ${newStatus}` });
      fetchWorkOrder();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      Toast.show({ type: 'success', text1: 'Image attached' });
    }
  };

  if (!workOrder) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <View style={styles.header}>
          <Badge 
            value={workOrder.status} 
            status={workOrder.status === 'completed' ? 'success' : 'primary'}
          />
          <Text style={styles.woNumber}>{workOrder.woNumber}</Text>
        </View>
        
        <Text h4 style={styles.title}>{workOrder.title}</Text>
        
        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>{workOrder.description}</Text>
        
        <Text style={styles.label}>Asset</Text>
        <Text style={styles.value}>{workOrder.assetName || 'N/A'}</Text>
        
        <Text style={styles.label}>Due Date</Text>
        <Text style={styles.value}>
          {workOrder.dueDate ? format(workOrder.dueDate.toDate(), 'MMM d, yyyy') : 'Not set'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>Notes</Text>
        <Input
          placeholder="Add completion notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
        
        <Button
          title="Attach Photo"
          type="outline"
          onPress={pickImage}
          icon={{ name: 'camera', type: 'material' }}
          containerStyle={styles.button}
        />
      </Card>

      <View style={styles.actions}>
        {workOrder.status === 'open' && (
          <Button
            title="Start Work"
            onPress={() => updateStatus('in_progress')}
            loading={loading}
            containerStyle={styles.button}
          />
        )}
        
        {workOrder.status === 'in_progress' && (
          <>
            <Button
              title="Complete Task"
              onPress={() => updateStatus('completed')}
              loading={loading}
              containerStyle={styles.button}
            />
            <Button
              title="Need Parts"
              type="outline"
              onPress={() => navigation.navigate('Inventory' as never)}
              containerStyle={styles.button}
            />
          </>
        )}
      </View>

      {!isOnline && (
        <Badge 
          value="Offline Mode" 
          status="warning" 
          containerStyle={styles.offlineBadge}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  woNumber: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  title: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
  offlineBadge: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});
