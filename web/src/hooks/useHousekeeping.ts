import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, CleaningTask, HousekeepingInspection } from '@/types/housekeeping';

const COLLECTIONS = {
  rooms: 'rooms',
  cleaningTasks: 'cleaningTasks',
  inspections: 'housekeepingInspections',
};

export const useRooms = (companyId?: string) => {
  return useQuery(
    ['rooms', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.rooms), orderBy('roomNumber', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    },
    { enabled: true }
  );
};

export const useRoom = (id: string) => {
  return useQuery(
    ['room', id],
    async () => {
      const docRef = doc(db, COLLECTIONS.rooms, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Room;
    },
    { enabled: !!id }
  );
};

export const useCleaningTasks = (companyId?: string, filters?: { roomId?: string; status?: string; assignedTo?: string }) => {
  return useQuery(
    ['cleaningTasks', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.cleaningTasks), orderBy('scheduledDate', 'desc'));
      
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.roomId) {
        q = query(q, where('roomId', '==', filters.roomId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CleaningTask));
    },
    { enabled: true }
  );
};

export const useTodayCleaningTasks = (companyId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  return useQuery(
    ['cleaningTasks', 'today', companyId, today],
    async () => {
      let q = query(
        collection(db, COLLECTIONS.cleaningTasks),
        where('scheduledDate', '==', today),
        orderBy('priority', 'desc')
      );
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CleaningTask));
    },
    { enabled: true }
  );
};

export const useRoomMutations = () => {
  const queryClient = useQueryClient();

  const createRoom = useMutation(
    async (data: Omit<Room, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.rooms), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      },
    }
  );

  const updateRoom = useMutation(
    async ({ id, data }: { id: string; data: Partial<Room> }) => {
      await updateDoc(doc(db, COLLECTIONS.rooms, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      },
    }
  );

  const deleteRoom = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.rooms, id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      },
    }
  );

  const updateRoomStatus = useMutation(
    async ({ id, status, lastCleaned }: { id: string; status: Room['status']; lastCleaned?: string }) => {
      const update: Partial<Room> = { status };
      if (lastCleaned) update.lastCleaned = lastCleaned;
      await updateDoc(doc(db, COLLECTIONS.rooms, id), {
        ...update,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      },
    }
  );

  return { createRoom, updateRoom, deleteRoom, updateRoomStatus };
};

export const useCleaningTaskMutations = () => {
  const queryClient = useQueryClient();

  const createTask = useMutation(
    async (data: Omit<CleaningTask, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.cleaningTasks), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  const updateTask = useMutation(
    async ({ id, data }: { id: string; data: Partial<CleaningTask> }) => {
      await updateDoc(doc(db, COLLECTIONS.cleaningTasks, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  const startTask = useMutation(
    async ({ id, housekeeperId, housekeeperName }: { id: string; housekeeperId: string; housekeeperName: string }) => {
      await updateDoc(doc(db, COLLECTIONS.cleaningTasks, id), {
        status: 'in-progress',
        startedAt: new Date().toISOString(),
        assignedTo: housekeeperId,
        assignedToName: housekeeperName,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  const completeTask = useMutation(
    async ({ id, notes, itemsUsed }: { id: string; notes?: string; itemsUsed?: any }) => {
      await updateDoc(doc(db, COLLECTIONS.cleaningTasks, id), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        notes: notes || '',
        itemsToReplenish: itemsUsed || {},
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  const verifyTask = useMutation(
    async ({ id, inspectorId, inspectorName }: { id: string; inspectorId: string; inspectorName: string }) => {
      await updateDoc(doc(db, COLLECTIONS.cleaningTasks, id), {
        status: 'verified',
        verifiedBy: inspectorId,
        verifiedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  const deleteTask = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.cleaningTasks, id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cleaningTasks');
      },
    }
  );

  return { createTask, updateTask, startTask, completeTask, verifyTask, deleteTask };
};

export const useInspectionMutations = () => {
  const queryClient = useQueryClient();

  const createInspection = useMutation(
    async (data: Omit<HousekeepingInspection, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.inspections), {
        ...data,
        createdAt: serverTimestamp(),
      });
      
      // Update room status if inspection passed
      if (data.overallStatus === 'passed') {
        await updateDoc(doc(db, COLLECTIONS.rooms, data.roomId), {
          status: 'vacant-clean',
          updatedAt: serverTimestamp(),
        });
      }
      
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inspections']);
        queryClient.invalidateQueries(['rooms']);
      },
    }
  );

  return { createInspection };
};

export const useRoomInspections = (roomId?: string) => {
  return useQuery(
    ['inspections', roomId],
    async () => {
      let q = query(collection(db, COLLECTIONS.inspections), orderBy('inspectionDate', 'desc'));
      if (roomId) {
        q = query(q, where('roomId', '==', roomId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HousekeepingInspection));
    },
    { enabled: !!roomId }
  );
};

export const useRoomStats = (companyId?: string) => {
  return useQuery(
    ['roomStats', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.rooms));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      const rooms = snapshot.docs.map(doc => doc.data() as Room);
      
      const stats = {
        total: rooms.length,
        vacantClean: rooms.filter(r => r.status === 'vacant-clean').length,
        vacantDirty: rooms.filter(r => r.status === 'vacant-dirty').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        doNotDisturb: rooms.filter(r => r.status === 'occupied-do-not-disturb').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
        outOfOrder: rooms.filter(r => r.status === 'out-of-order').length,
      };
      
      return stats;
    },
    { enabled: true }
  );
};
