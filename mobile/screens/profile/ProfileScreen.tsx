import { View, StyleSheet } from 'react-native';
import { Text, Avatar, ListItem, Button, Card } from '@rneui/themed';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount } = useOffline();

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.header}>
          <Avatar
            rounded
            size="large"
            title={user?.name?.charAt(0).toUpperCase()}
            containerStyle={styles.avatar}
          />
          <View>
            <Text h4>{user?.name}</Text>
            <Text style={styles.role}>{user?.role}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Connection Status</ListItem.Title>
            <ListItem.Subtitle style={isOnline ? styles.online : styles.offline}>
              {isOnline ? 'Online' : 'Offline'}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>

        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Pending Sync</ListItem.Title>
            <ListItem.Subtitle>
              {pendingCount} {pendingCount === 1 ? 'action' : 'actions'} waiting
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>

        <ListItem>
          <ListItem.Content>
            <ListItem.Title>App Version</ListItem.Title>
            <ListItem.Subtitle>1.0.0</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      </Card>

      <Button
        title="Logout"
        type="outline"
        onPress={logout}
        containerStyle={styles.logout}
        buttonStyle={styles.logoutButton}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#3b82f6',
    marginRight: 16,
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  online: {
    color: '#22c55e',
  },
  offline: {
    color: '#ef4444',
  },
  logout: {
    margin: 16,
  },
  logoutButton: {
    borderColor: '#ef4444',
  },
});
