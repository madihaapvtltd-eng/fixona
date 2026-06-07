import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { KitchenAsset, RestaurantOutlet, FBDailyLog, MenuItem, InventoryItem } from '@/types/foodbeverage';

const COLLECTIONS = {
  kitchenAssets: 'kitchenAssets',
  outlets: 'restaurantOutlets',
  dailyLogs: 'fbDailyLogs',
  menuItems: 'menuItems',
  inventory: 'fbInventory',
};

// Kitchen Assets
export const useKitchenAssets = (companyId?: string, filters?: { type?: string; location?: string }) => {
  return useQuery(
    ['kitchenAssets', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.kitchenAssets), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.type) {
        q = query(q, where('assetType', '==', filters.type));
      }
      if (filters?.location) {
        q = query(q, where('location', '==', filters.location));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KitchenAsset));
    },
    { enabled: true }
  );
};

export const useKitchenAssetMutations = () => {
  const queryClient = useQueryClient();

  const createAsset = useMutation(
    async (data: Omit<KitchenAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.kitchenAssets), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('kitchenAssets');
      },
    }
  );

  const updateAsset = useMutation(
    async ({ id, data }: { id: string; data: Partial<KitchenAsset> }) => {
      await updateDoc(doc(db, COLLECTIONS.kitchenAssets, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('kitchenAssets');
      },
    }
  );

  const updateTemperature = useMutation(
    async ({ id, temperature }: { id: string; temperature: number }) => {
      await updateDoc(doc(db, COLLECTIONS.kitchenAssets, id), {
        currentTemp: temperature,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('kitchenAssets');
      },
    }
  );

  return { createAsset, updateAsset, updateTemperature };
};

// Restaurant Outlets
export const useRestaurantOutlets = (companyId?: string) => {
  return useQuery(
    ['restaurantOutlets', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.outlets), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantOutlet));
    },
    { enabled: true }
  );
};

export const useOutletMutations = () => {
  const queryClient = useQueryClient();

  const createOutlet = useMutation(
    async (data: Omit<RestaurantOutlet, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.outlets), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('restaurantOutlets');
      },
    }
  );

  return { createOutlet };
};

// Daily Logs
export const useFBDailyLogs = (outletId?: string, companyId?: string, limit: number = 30) => {
  return useQuery(
    ['fbDailyLogs', outletId, companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.dailyLogs), orderBy('date', 'desc'));
      if (outletId) {
        q = query(q, where('outletId', '==', outletId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as FBDailyLog));
    },
    { enabled: true }
  );
};

export const useFBDailyLogMutations = () => {
  const queryClient = useQueryClient();

  const createLog = useMutation(
    async (data: Omit<FBDailyLog, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.dailyLogs), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fbDailyLogs');
      },
    }
  );

  return { createLog };
};

// Menu Items
export const useMenuItems = (outletId?: string, companyId?: string) => {
  return useQuery(
    ['menuItems', outletId, companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.menuItems), where('isActive', '==', true), orderBy('name', 'asc'));
      if (outletId) {
        q = query(q, where('outletId', '==', outletId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    },
    { enabled: true }
  );
};

// Inventory
export const useFBInventory = (companyId?: string, category?: string) => {
  return useQuery(
    ['fbInventory', companyId, category],
    async () => {
      let q = query(collection(db, COLLECTIONS.inventory), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (category) {
        q = query(q, where('category', '==', category));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
    },
    { enabled: true }
  );
};

export const useFBInventoryMutations = () => {
  const queryClient = useQueryClient();

  const updateStock = useMutation(
    async ({ id, quantity, operation }: { id: string; quantity: number; operation: 'add' | 'remove' | 'set' }) => {
      const docRef = doc(db, COLLECTIONS.inventory, id);
      const snapshot = await getDoc(docRef);
      const current = snapshot.data() as InventoryItem;
      
      let newStock: number;
      switch (operation) {
        case 'add':
          newStock = current.currentStock + quantity;
          break;
        case 'remove':
          newStock = Math.max(0, current.currentStock - quantity);
          break;
        case 'set':
          newStock = quantity;
          break;
        default:
          newStock = current.currentStock;
      }
      
      await updateDoc(docRef, {
        currentStock: newStock,
        totalValue: newStock * current.unitCost,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fbInventory');
      },
    }
  );

  return { updateStock };
};

// Stats
export const useFBStats = (companyId?: string) => {
  return useQuery(
    ['fbStats', companyId],
    async () => {
      let assetsQuery = query(collection(db, COLLECTIONS.kitchenAssets));
      let outletsQuery = query(collection(db, COLLECTIONS.outlets));
      let inventoryQuery = query(collection(db, COLLECTIONS.inventory));
      
      const today = new Date().toISOString().split('T')[0];
      let logsQuery = query(collection(db, COLLECTIONS.dailyLogs), where('date', '==', today));
      
      if (companyId) {
        assetsQuery = query(assetsQuery, where('companyId', '==', companyId));
        outletsQuery = query(outletsQuery, where('companyId', '==', companyId));
        inventoryQuery = query(inventoryQuery, where('companyId', '==', companyId));
        logsQuery = query(logsQuery, where('companyId', '==', companyId));
      }
      
      const [assetsSnap, outletsSnap, inventorySnap, logsSnap] = await Promise.all([
        getDocs(assetsQuery),
        getDocs(outletsQuery),
        getDocs(inventoryQuery),
        getDocs(logsQuery),
      ]);
      
      const assets = assetsSnap.docs.map(d => d.data() as KitchenAsset);
      const inventory = inventorySnap.docs.map(d => d.data() as InventoryItem);
      const logs = logsSnap.docs.map(d => d.data() as FBDailyLog);
      
      const lowTempAssets = assets.filter(a => 
        (a.targetTempMin && a.currentTemp && a.currentTemp > a.targetTempMin + 5) ||
        (a.targetTempMax && a.currentTemp && a.currentTemp < a.targetTempMax - 5)
      );
      
      const lowStockItems = inventory.filter(i => i.currentStock <= i.reorderPoint);
      
      const todayRevenue = logs.reduce((sum, log) => sum + (log.totalRevenue || 0), 0);
      const todayCovers = logs.reduce((sum, log) => sum + (log.totalCovers || 0), 0);
      
      return {
        totalAssets: assets.length,
        operationalAssets: assets.filter(a => a.status === 'operational').length,
        needsMaintenance: assets.filter(a => a.status === 'needs-repair' || a.status === 'maintenance').length,
        lowTempAssets: lowTempAssets.length,
        totalOutlets: outletsSnap.docs.length,
        openOutlets: outletsSnap.docs.filter(d => d.data().status === 'open').length,
        inventoryItems: inventory.length,
        lowStockItems: lowStockItems.length,
        inventoryValue: inventory.reduce((sum, i) => sum + (i.totalValue || 0), 0),
        todayRevenue,
        todayCovers,
        todayComplaints: logs.reduce((sum, log) => sum + (log.complaints || 0), 0),
      };
    },
    { enabled: true }
  );
};
