import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import type { ColdRoomAsset, TemperatureLog, ColdRoomAlert, ColdRoomMaintenanceRecord } from '@/types/coldroom';
import toast from 'react-hot-toast';

// Fetch all cold rooms
export function useColdRooms() {
  const { user, getCompanyId, isSuperAdmin } = useAuthStore();
  const companyId = getCompanyId();

  return useQuery(['coldRooms', companyId], async () => {
    let q;
    if (isSuperAdmin() && !companyId) {
      q = query(collection(db, 'coldRooms'), orderBy('createdAt', 'desc'));
    } else if (companyId) {
      q = query(
        collection(db, 'coldRooms'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      return [];
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ColdRoomAsset[];
  }, {
    enabled: !!user,
  });
}

// Create cold room
export function useCreateColdRoom() {
  const queryClient = useQueryClient();
  const { getCompanyId, companies } = useAuthStore();

  return useMutation(
    async (data: Omit<ColdRoomAsset, 'id' | 'createdAt' | 'currentTemp' | 'status'>) => {
      const companyId = getCompanyId();
      const company = companies.find(c => c.id === companyId);
      
      const docRef = await addDoc(collection(db, 'coldRooms'), {
        ...data,
        companyId,
        companyName: company?.name || '',
        status: 'normal',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRooms');
        toast.success('Cold room added successfully');
      },
      onError: () => toast.error('Failed to add cold room'),
    }
  );
}

// Update cold room
export function useUpdateColdRoom() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, data }: { id: string; data: Partial<ColdRoomAsset> }) => {
      await updateDoc(doc(db, 'coldRooms', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRooms');
        toast.success('Cold room updated successfully');
      },
      onError: () => toast.error('Failed to update cold room'),
    }
  );
}

// Delete cold room
export function useDeleteColdRoom() {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, 'coldRooms', id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRooms');
        toast.success('Cold room deleted successfully');
      },
      onError: () => toast.error('Failed to delete cold room'),
    }
  );
}

// Log temperature check
export function useLogTemperature() {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Omit<TemperatureLog, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, 'temperatureLogs'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Update cold room with current temperature
      await updateDoc(doc(db, 'coldRooms', data.coldRoomId), {
        currentTemp: data.temperature,
        currentHumidity: data.humidity,
        lastCheckAt: new Date(),
        status: data.isOutOfRange ? 'warning' : 'normal',
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['temperatureLogs'] });
        queryClient.invalidateQueries({ queryKey: ['coldRooms'] });
        queryClient.invalidateQueries({ queryKey: ['todayCheckStatus'] });
        toast.success('Temperature logged successfully');
      },
      onError: () => toast.error('Failed to log temperature'),
    }
  );
}

// Fetch temperature logs
export function useTemperatureLogs(coldRoomId?: string, dateFrom?: Date, dateTo?: Date) {
  const { user, getCompanyId } = useAuthStore();
  const companyId = getCompanyId();

  return useQuery(['temperatureLogs', coldRoomId, companyId, dateFrom, dateTo], async () => {
    let q = query(
      collection(db, 'temperatureLogs'),
      orderBy('recordedAt', 'desc')
    );
    
    if (coldRoomId) {
      q = query(q, where('coldRoomId', '==', coldRoomId));
    }
    
    if (companyId) {
      q = query(q, where('companyId', '==', companyId));
    }
    
    const snap = await getDocs(q);
    let logs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as TemperatureLog[];
    
    // Filter by date range client-side
    if (dateFrom) {
      logs = logs.filter(l => l.recordedAt >= dateFrom);
    }
    if (dateTo) {
      logs = logs.filter(l => l.recordedAt <= dateTo);
    }
    
    return logs;
  }, {
    enabled: !!user,
  });
}

// Check if temperature check is needed
export function useCheckStatus(coldRoomId: string) {
  const { data: logs } = useTemperatureLogs(coldRoomId);
  
  const now = new Date();
  const today = now.toDateString();
  const hour = now.getHours();
  
  const todayLogs = logs?.filter(l => new Date(l.recordedAt).toDateString() === today);
  
  const morningDone = todayLogs?.some(l => l.checkTime === 'morning');
  const middayDone = todayLogs?.some(l => l.checkTime === 'midday');
  const eveningDone = todayLogs?.some(l => l.checkTime === 'evening');
  
  // Determine which check is needed
  let neededCheck: 'morning' | 'midday' | 'evening' | null = null;
  
  if (hour >= 8 && hour < 18 && !morningDone) {
    neededCheck = 'morning';
  } else if (hour >= 11 && hour < 16 && !middayDone) {
    neededCheck = 'midday';
  } else if (hour >= 16 && hour < 22 && !eveningDone) {
    neededCheck = 'evening';
  }
  
  return {
    morningDone,
    middayDone,
    eveningDone,
    neededCheck,
    todayLogs,
    isComplete: morningDone && middayDone && eveningDone,
  };
}

// Fetch cold room alerts
export function useColdRoomAlerts(coldRoomId?: string, activeOnly = true) {
  const { user, getCompanyId } = useAuthStore();
  const companyId = getCompanyId();

  return useQuery(['coldRoomAlerts', coldRoomId, companyId, activeOnly], async () => {
    let q = query(collection(db, 'coldRoomAlerts'), orderBy('createdAt', 'desc'));
    
    if (coldRoomId) {
      q = query(q, where('coldRoomId', '==', coldRoomId));
    }
    
    if (companyId) {
      q = query(q, where('companyId', '==', companyId));
    }
    
    if (activeOnly) {
      q = query(q, where('isActive', '==', true));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ColdRoomAlert[];
  }, {
    enabled: !!user,
  });
}

// Acknowledge alert
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation(
    async (alertId: string) => {
      await updateDoc(doc(db, 'coldRoomAlerts', alertId), {
        acknowledgedAt: new Date(),
        acknowledgedBy: user?.name || user?.email,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRoomAlerts');
        toast.success('Alert acknowledged');
      },
      onError: () => toast.error('Failed to acknowledge alert'),
    }
  );
}

// Resolve alert
export function useResolveAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation(
    async ({ alertId, resolution }: { alertId: string; resolution: string }) => {
      await updateDoc(doc(db, 'coldRoomAlerts', alertId), {
        isActive: false,
        resolvedAt: new Date(),
        resolvedBy: user?.name || user?.email,
        resolution,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRoomAlerts');
        toast.success('Alert resolved');
      },
      onError: () => toast.error('Failed to resolve alert'),
    }
  );
}

// Real-time temperature monitoring
export function useRealtimeTemperature(coldRoomId?: string) {
  const [temp, setTemp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coldRoomId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'coldRooms', coldRoomId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as ColdRoomAsset;
          setTemp(data.currentTemp ?? null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching temperature:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [coldRoomId]);

  return { temp, loading };
}

// Add maintenance record
export function useAddMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Omit<ColdRoomMaintenanceRecord, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, 'coldRoomMaintenance'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Update cold room status if needed
      if (data.status === 'completed') {
        await updateDoc(doc(db, 'coldRooms', data.coldRoomId), {
          status: 'normal',
          updatedAt: serverTimestamp(),
        });
      }
      
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coldRoomMaintenance');
        queryClient.invalidateQueries('coldRooms');
        toast.success('Maintenance record added');
      },
      onError: () => toast.error('Failed to add maintenance record'),
    }
  );
}

// Fetch maintenance records
export function useColdRoomMaintenance(coldRoomId?: string) {
  const { user, getCompanyId } = useAuthStore();
  const companyId = getCompanyId();

  return useQuery(['coldRoomMaintenance', coldRoomId, companyId], async () => {
    let q = query(
      collection(db, 'coldRoomMaintenance'),
      orderBy('scheduledDate', 'desc')
    );
    
    if (coldRoomId) {
      q = query(q, where('coldRoomId', '==', coldRoomId));
    }
    
    if (companyId) {
      q = query(q, where('companyId', '==', companyId));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ColdRoomMaintenanceRecord[];
  }, {
    enabled: !!user,
  });
}

// Get today's check status for all cold rooms
export function useTodayCheckStatus() {
  const { data: coldRooms } = useColdRooms();
  const { data: allLogs } = useTemperatureLogs();
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['todayCheckStatus', allLogs?.length, coldRooms?.length],
    queryFn: () => {
      const now = new Date();
      const today = now.toDateString();
      
      const status = coldRooms?.map(room => {
        const roomLogs = allLogs?.filter(l => {
          if (l.coldRoomId !== room.id) return false;
          // Handle Firestore Timestamp or Date
          const recordedAt = (l.recordedAt && typeof (l.recordedAt as any).toDate === 'function') 
            ? (l.recordedAt as any).toDate() 
            : new Date(l.recordedAt);
          return recordedAt.toDateString() === today;
        });
        
        // Get temps for each check time
        const morningLog = roomLogs?.find(l => l.checkTime === 'morning');
        const middayLog = roomLogs?.find(l => l.checkTime === 'midday');
        const eveningLog = roomLogs?.find(l => l.checkTime === 'evening');
        
        return {
          coldRoomId: room.id,
          coldRoomName: room.name,
          morningDone: !!morningLog,
          middayDone: !!middayLog,
          eveningDone: !!eveningLog,
          morningTemp: morningLog?.temperature,
          middayTemp: middayLog?.temperature,
          eveningTemp: eveningLog?.temperature,
          lastTemp: room.currentTemp,
          status: room.status,
        };
      });
      
      return status || [];
    },
    enabled: !!user && !!coldRooms && !!allLogs,
    staleTime: 0, // Always refetch when invalidated
  });
}
