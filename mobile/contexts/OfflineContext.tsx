import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineContextType {
  isOnline: boolean;
  queueAction: (action: QueuedAction) => void;
  syncPendingActions: () => Promise<void>;
  pendingCount: number;
}

interface QueuedAction {
  id: string;
  type: 'update_work_order' | 'create_log' | 'update_inventory';
  data: any;
  timestamp: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncPendingActions();
    }
  }, [isOnline]);

  const checkConnection = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOnline(networkState.isConnected && networkState.isInternetReachable);
  };

  const queueAction = async (action: QueuedAction) => {
    const pending = await AsyncStorage.getItem('pendingActions');
    const actions = pending ? JSON.parse(pending) : [];
    actions.push(action);
    await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
    setPendingCount(actions.length);
  };

  const syncPendingActions = async () => {
    const pending = await AsyncStorage.getItem('pendingActions');
    if (!pending) return;

    const actions: QueuedAction[] = JSON.parse(pending);
    const failed: QueuedAction[] = [];

    for (const action of actions) {
      try {
        // Sync logic would go here
        console.log('Syncing action:', action);
      } catch (error) {
        failed.push(action);
      }
    }

    await AsyncStorage.setItem('pendingActions', JSON.stringify(failed));
    setPendingCount(failed.length);
  };

  return (
    <OfflineContext.Provider value={{ isOnline, queueAction, syncPendingActions, pendingCount }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
