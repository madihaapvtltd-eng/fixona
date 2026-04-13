import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PoolSpaAsset, WaterTestLog, PoolMaintenanceRecord, PoolAlert } from '@/types/poolspa';

const COLLECTIONS = {
  assets: 'poolSpaAssets',
  testLogs: 'waterTestLogs',
  maintenance: 'poolMaintenanceRecords',
  alerts: 'poolAlerts',
};

export const usePoolSpaAssets = (companyId?: string) => {
  return useQuery(
    ['poolSpaAssets', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.assets), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoolSpaAsset));
    },
    { enabled: true }
  );
};

export const usePoolSpaAsset = (id: string) => {
  return useQuery(
    ['poolSpaAsset', id],
    async () => {
      const docRef = doc(db, COLLECTIONS.assets, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as PoolSpaAsset;
    },
    { enabled: !!id }
  );
};

export const useWaterTestLogs = (assetId?: string, companyId?: string, limit: number = 30) => {
  return useQuery(
    ['waterTestLogs', assetId, companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.testLogs), orderBy('testDate', 'desc'), orderBy('testTime', 'desc'));
      if (assetId) {
        q = query(q, where('assetId', '==', assetId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as WaterTestLog));
    },
    { enabled: true }
  );
};

export const useTodayWaterTests = (companyId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  return useQuery(
    ['waterTestLogs', 'today', companyId, today],
    async () => {
      let q = query(
        collection(db, COLLECTIONS.testLogs),
        where('testDate', '==', today),
        orderBy('testTime', 'desc')
      );
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaterTestLog));
    },
    { enabled: true }
  );
};

export const usePoolSpaAssetMutations = () => {
  const queryClient = useQueryClient();

  const createAsset = useMutation(
    async (data: Omit<PoolSpaAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.assets), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('poolSpaAssets');
      },
    }
  );

  const updateAsset = useMutation(
    async ({ id, data }: { id: string; data: Partial<PoolSpaAsset> }) => {
      await updateDoc(doc(db, COLLECTIONS.assets, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('poolSpaAssets');
        queryClient.invalidateQueries('poolSpaAsset');
      },
    }
  );

  const deleteAsset = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.assets, id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('poolSpaAssets');
      },
    }
  );

  return { createAsset, updateAsset, deleteAsset };
};

export const useWaterTestMutations = () => {
  const queryClient = useQueryClient();

  const createTestLog = useMutation(
    async (data: Omit<WaterTestLog, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.testLogs), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Check for alerts
      const standards = {
        ph: { min: 7.2, max: 7.8 },
        chlorine: { min: 1.0, max: 3.0 },
        alkalinity: { min: 80, max: 120 },
      };
      
      const alerts: PoolAlert[] = [];
      
      if (data.phLevel < standards.ph.min) {
        alerts.push({
          id: '',
          assetId: data.assetId,
          assetName: data.assetName,
          type: 'ph-low',
          severity: 'warning',
          message: `pH level too low (${data.phLevel}), target: 7.2-7.8`,
          value: data.phLevel,
          targetRange: '7.2-7.8',
          isResolved: false,
          companyId: data.companyId,
          companyName: data.companyName,
          createdAt: new Date().toISOString(),
        });
      } else if (data.phLevel > standards.ph.max) {
        alerts.push({
          id: '',
          assetId: data.assetId,
          assetName: data.assetName,
          type: 'ph-high',
          severity: 'warning',
          message: `pH level too high (${data.phLevel}), target: 7.2-7.8`,
          value: data.phLevel,
          targetRange: '7.2-7.8',
          isResolved: false,
          companyId: data.companyId,
          companyName: data.companyName,
          createdAt: new Date().toISOString(),
        });
      }
      
      if (data.chlorineLevel < standards.chlorine.min) {
        alerts.push({
          id: '',
          assetId: data.assetId,
          assetName: data.assetName,
          type: 'chlorine-low',
          severity: 'critical',
          message: `Chlorine level too low (${data.chlorineLevel} ppm), target: 1.0-3.0 ppm`,
          value: data.chlorineLevel,
          targetRange: '1.0-3.0 ppm',
          isResolved: false,
          companyId: data.companyId,
          companyName: data.companyName,
          createdAt: new Date().toISOString(),
        });
      } else if (data.chlorineLevel > standards.chlorine.max) {
        alerts.push({
          id: '',
          assetId: data.assetId,
          assetName: data.assetName,
          type: 'chlorine-high',
          severity: 'warning',
          message: `Chlorine level too high (${data.chlorineLevel} ppm), target: 1.0-3.0 ppm`,
          value: data.chlorineLevel,
          targetRange: '1.0-3.0 ppm',
          isResolved: false,
          companyId: data.companyId,
          companyName: data.companyName,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Create alerts if needed
      for (const alert of alerts) {
        await addDoc(collection(db, COLLECTIONS.alerts), {
          ...alert,
          createdAt: serverTimestamp(),
        });
      }
      
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterTestLogs');
        queryClient.invalidateQueries('poolAlerts');
      },
    }
  );

  return { createTestLog };
};

export const usePoolMaintenanceMutations = () => {
  const queryClient = useQueryClient();

  const createMaintenance = useMutation(
    async (data: Omit<PoolMaintenanceRecord, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.maintenance), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('poolMaintenance');
      },
    }
  );

  return { createMaintenance };
};

export const usePoolAlerts = (companyId?: string, unresolvedOnly: boolean = true) => {
  return useQuery(
    ['poolAlerts', companyId, unresolvedOnly],
    async () => {
      let q = query(collection(db, COLLECTIONS.alerts), orderBy('createdAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (unresolvedOnly) {
        q = query(q, where('isResolved', '==', false));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoolAlert));
    },
    { enabled: true }
  );
};

export const usePoolAlertMutations = () => {
  const queryClient = useQueryClient();

  const resolveAlert = useMutation(
    async ({ id, resolvedBy }: { id: string; resolvedBy: string }) => {
      await updateDoc(doc(db, COLLECTIONS.alerts, id), {
        isResolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('poolAlerts');
      },
    }
  );

  return { resolveAlert };
};

export const usePoolSpaStats = (companyId?: string) => {
  return useQueryClient().fetchQuery(
    ['poolSpaStats', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.assets));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      const assets = snapshot.docs.map(doc => doc.data() as PoolSpaAsset);
      
      const today = new Date().toISOString().split('T')[0];
      let testsQuery = query(collection(db, COLLECTIONS.testLogs), where('testDate', '==', today));
      if (companyId) {
        testsQuery = query(testsQuery, where('companyId', '==', companyId));
      }
      const testsSnapshot = await getDocs(testsQuery);
      const todayTests = testsSnapshot.docs.length;
      
      let alertsQuery = query(collection(db, COLLECTIONS.alerts), where('isResolved', '==', false));
      if (companyId) {
        alertsQuery = query(alertsQuery, where('companyId', '==', companyId));
      }
      const alertsSnapshot = await getDocs(alertsQuery);
      const unresolvedAlerts = alertsSnapshot.docs.length;
      
      return {
        totalAssets: assets.length,
        operational: assets.filter(a => a.status === 'operational').length,
        inMaintenance: assets.filter(a => a.status === 'maintenance').length,
        closed: assets.filter(a => a.status === 'closed' || a.status === 'seasonal-closure').length,
        todayTests,
        unresolvedAlerts,
        needsAttention: assets.filter(a => a.condition === 'fair' || a.condition === 'needs-repair').length,
      };
    }
  );
};
