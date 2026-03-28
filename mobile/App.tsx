import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, createTheme } from '@rneui/themed';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';

import { LoginScreen } from './screens/auth/LoginScreen';
import { MainTabNavigator } from './navigation/MainTabNavigator';

const Stack = createStackNavigator();

const theme = createTheme({
  lightColors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#f8fafc',
    white: '#ffffff',
    grey0: '#f1f5f9',
    grey1: '#e2e8f0',
    grey2: '#cbd5e1',
    grey3: '#94a3b8',
    grey4: '#64748b',
    grey5: '#475569',
    greyOutline: '#e2e8f0',
    searchBg: '#f1f5f9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  darkColors: {
    primary: '#60a5fa',
  },
  mode: 'light',
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <OfflineProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
            <Toast />
            <StatusBar style="auto" />
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
