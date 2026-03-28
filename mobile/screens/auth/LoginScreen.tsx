import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, Button, Text, Card } from '@rneui/themed';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigation = useNavigation();

  // Auto-redirect if already logged in
  if (user) {
    navigation.navigate('Main' as never);
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      navigation.navigate('Main' as never);
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Text h3 style={styles.title}>CMMS Mobile</Text>
        <Text style={styles.subtitle}>Maintenance Management</Text>
        
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={{ type: 'material', name: 'email' }}
        />
        
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={{ type: 'material', name: 'lock' }}
        />
        
        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          containerStyle={styles.button}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  card: {
    borderRadius: 12,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#3b82f6',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#64748b',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
});
