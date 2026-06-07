import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import type { GeneratorAsset, GeneratorRuntimeLog, GeneratorMaintenanceRecord, GeneratorAlarm } from '@/types/generator';
import toast from 'react-hot-toast';

// Fetch all generators
export function useGenerators() {
  const { user, getCompanyId, isSuperAdmin } = useAuthStore();
  const companyId = getCompanyId();

  return useQuery(['generators', companyId], async () => {
    let q;
    if (isSuperAdmin() && !companyId) {
      q = query(collection(db, 'generators'), orderBy('createdAt', 'desc'));
    } else if (companyId) {
      q = query(
        collection(db, 'generators'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      return [];
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as GeneratorAsset[];
  }, {
    enabled: !!user && (user.role === 'super_admin' || user.role === 'company_admin'),
  });
}

// Create generator
export function useCreateGenerator() {
  const queryClient = useQueryClient();
  const { getCompanyId } = useAuthStore();

  return useMutation(
    async (data: Omit<GeneratorAsset, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, 'generators'), {
        ...data,
        companyId: getCompanyId(),
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generators');
        toast.success('Generator created successfully');
      },
      onError: () => toast.error('Failed to create generator'),
    }
  );
}

// Update generator
export function useUpdateGenerator() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, data }: { id: string; data: Partial<GeneratorAsset> }) => {
      await updateDoc(doc(db, 'generators', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generators');
        toast.success('Generator updated successfully');
      },
      onError: () => toast.error('Failed to update generator'),
    }
  );
}

// Delete generator
export function useDeleteGenerator() {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, 'generators', id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generators');
        toast.success('Generator deleted successfully');
      },
      onError: () => toast.error('Failed to delete generator'),
    }
  );
}

// Start generator runtime tracking
export function useStartGenerator() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, operatorName }: { id: string; operatorName?: string }) => {
      const now = new Date();
      
      // Update generator status
      await updateDoc(doc(db, 'generators', id), {
        isRunning: true,
        status: 'running',
        lastStartTime: now,
        updatedAt: serverTimestamp(),
      });
      
      // Create runtime log
      await addDoc(collection(db, 'generatorRuntimeLogs'), {
        generatorId: id,
        startTime: now,
        operatorName: operatorName || 'Unknown',
        loadPercentage: 0,
        createdAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generators');
        queryClient.invalidateQueries('generatorRuntimeLogs');
        toast.success('Generator started - tracking runtime');
      },
      onError: () => toast.error('Failed to start generator'),
    }
  );
}

// Stop generator runtime tracking
export function useStopGenerator() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ 
      id, 
      runtimeHours, 
      fuelConsumed, 
      loadPercentage, 
      powerOutputKw,
      notes 
    }: { 
      id: string; 
      runtimeHours: number;
      fuelConsumed?: number;
      loadPercentage?: number;
      powerOutputKw?: number;
      notes?: string;
    }) => {
      const now = new Date();
      
      // Get generator data
      const genRef = doc(db, 'generators', id);
      
      // Update generator
      await updateDoc(genRef, {
        isRunning: false,
        status: 'standby',
        totalRuntimeHours: serverTimestamp() as any, // Will be handled by increment
        currentSessionHours: 0,
        lastStartTime: null,
        updatedAt: serverTimestamp(),
      });
      
      // Find and update the active runtime log
      const logsQuery = query(
        collection(db, 'generatorRuntimeLogs'),
        where('generatorId', '==', id),
        where('endTime', '==', null),
        orderBy('createdAt', 'desc')
      );
      const logsSnap = await getDocs(logsQuery);
      
      if (!logsSnap.empty) {
        const logDoc = logsSnap.docs[0];
        await updateDoc(doc(db, 'generatorRuntimeLogs', logDoc.id), {
          endTime: now,
          runtimeHours,
          fuelConsumed: fuelConsumed || 0,
          loadPercentage: loadPercentage || 0,
          powerOutputKw: powerOutputKw || 0,
          notes: notes || '',
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generators');
        queryClient.invalidateQueries('generatorRuntimeLogs');
        toast.success('Generator stopped - runtime logged');
      },
      onError: () => toast.error('Failed to stop generator'),
    }
  );
}

// Real-time generator status hook
export function useRealtimeGeneratorStatus(generatorId?: string) {
  const [generator, setGenerator] = useState<GeneratorAsset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generatorId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'generators', generatorId),
      (doc) => {
        if (doc.exists()) {
          setGenerator({ id: doc.id, ...doc.data() } as GeneratorAsset);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching generator status:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [generatorId]);

  return { generator, loading };
}

// Fetch runtime logs
export function useGeneratorRuntimeLogs(generatorId?: string) {
  return useQuery(['generatorRuntimeLogs', generatorId], async () => {
    if (!generatorId) return [];
    
    const q = query(
      collection(db, 'generatorRuntimeLogs'),
      where('generatorId', '==', generatorId),
      orderBy('createdAt', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as GeneratorRuntimeLog[];
  }, {
    enabled: !!generatorId,
  });
}

// Add maintenance record
export function useAddMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Omit<GeneratorMaintenanceRecord, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, 'generatorMaintenanceRecords'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Update generator next service hours
      await updateDoc(doc(db, 'generators', data.generatorId), {
        lastServiceDate: new Date(),
        nextServiceHours: data.nextServiceHours,
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generatorMaintenanceRecords');
        queryClient.invalidateQueries('generators');
        toast.success('Maintenance record added');
      },
      onError: () => toast.error('Failed to add maintenance record'),
    }
  );
}

// Fetch maintenance records
export function useGeneratorMaintenanceRecords(generatorId?: string) {
  return useQuery(['generatorMaintenanceRecords', generatorId], async () => {
    if (!generatorId) return [];
    
    const q = query(
      collection(db, 'generatorMaintenanceRecords'),
      where('generatorId', '==', generatorId),
      orderBy('createdAt', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as GeneratorMaintenanceRecord[];
  }, {
    enabled: !!generatorId,
  });
}

// Create fuel request when level is low
export function useCreateFuelRequestForGenerator() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ 
      generatorId, 
      generatorName, 
      fuelNeeded,
      companyId 
    }: { 
      generatorId: string; 
      generatorName: string;
      fuelNeeded: number;
      companyId?: string;
    }) => {
      await addDoc(collection(db, 'fuelRequests'), {
        generatorId,
        generatorName,
        fuelNeeded,
        companyId,
        status: 'pending',
        priority: 'high',
        type: 'generator_refuel',
        createdAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fuelRequests');
        toast.success('Fuel request created automatically');
      },
      onError: () => toast.error('Failed to create fuel request'),
    }
  );
}
