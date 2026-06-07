import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ListItem, SearchBar, Badge } from '@rneui/themed';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';

interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
}

export function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      items.filter(i => 
        i.name.toLowerCase().includes(term) ||
        i.partNumber.toLowerCase().includes(term)
      )
    );
  }, [search, items]);

  const fetchInventory = async () => {
    try {
      const q = query(collection(db, 'inventory'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setItems(data);
      setFiltered(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <ListItem bottomDivider>
      <ListItem.Content>
        <View style={styles.row}>
          <Text style={styles.partNumber}>{item.partNumber}</Text>
          {item.quantity <= item.minThreshold && (
            <Badge value="Low Stock" status="error" />
          )}
        </View>
        <ListItem.Title>{item.name}</ListItem.Title>
        <ListItem.Subtitle style={styles.subtitle}>
          {item.category} • Qty: {item.quantity}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search parts..."
        onChangeText={setSearch}
        value={search}
        platform="default"
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInput}
      />
      
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No items found</Text>
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
  searchContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partNumber: {
    fontSize: 12,
    color: '#64748b',
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
