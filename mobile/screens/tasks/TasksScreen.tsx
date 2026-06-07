import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, ListItem, Badge, Button } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  status: string;
  priority: string;
  dueDate: any;
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'work_orders'),
        where('assignedToId', '==', user.id),
        where('status', 'in', ['open', 'assigned', 'in_progress']),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkOrder[];
      
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      default: return 'success';
    }
  };

  const renderItem = ({ item }: { item: WorkOrder }) => (
    <ListItem 
      bottomDivider
      onPress={() => navigation.navigate('TaskDetail' as never, { id: item.id } as never)}
    >
      <ListItem.Content>
        <View style={styles.row}>
          <Badge 
            value={item.priority} 
            status={getPriorityColor(item.priority)} 
            containerStyle={styles.badge}
          />
          <Text style={styles.woNumber}>{item.woNumber}</Text>
        </View>
        <ListItem.Title style={styles.title}>{item.title}</ListItem.Title>
        <ListItem.Subtitle style={styles.subtitle}>
          Due: {item.dueDate ? format(item.dueDate.toDate(), 'MMM d') : 'Not set'}
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <Text h4 style={styles.header}>My Tasks ({tasks.length})</Text>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No pending tasks</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    marginRight: 8,
  },
  woNumber: {
    fontSize: 12,
    color: '#64748b',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748b',
  },
});
