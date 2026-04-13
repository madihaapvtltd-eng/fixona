import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Shift, StaffSchedule, TimeOffRequest, StaffAvailability, ScheduleTemplate } from '@/types/staffscheduling';

const COLLECTIONS = {
  shifts: 'shifts',
  schedules: 'staffSchedules',
  timeOff: 'timeOffRequests',
  availability: 'staffAvailability',
  templates: 'scheduleTemplates',
};

// Shifts
export const useShifts = (companyId?: string) => {
  return useQuery(
    ['shifts', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.shifts), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    },
    { enabled: true }
  );
};

export const useShiftMutations = () => {
  const queryClient = useQueryClient();

  const createShift = useMutation(
    async (data: Omit<Shift, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.shifts), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shifts');
      },
    }
  );

  return { createShift };
};

// Schedules
export const useSchedules = (companyId?: string, filters?: { staffId?: string; date?: string; department?: string }) => {
  return useQuery(
    ['schedules', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.schedules), orderBy('date', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.staffId) {
        q = query(q, where('staffId', '==', filters.staffId));
      }
      if (filters?.date) {
        q = query(q, where('date', '==', filters.date));
      }
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffSchedule));
    },
    { enabled: true }
  );
};

export const useStaffWeeklySchedule = (staffId: string, weekStart: string) => {
  return useQuery(
    ['schedules', 'weekly', staffId, weekStart],
    async () => {
      // Get 7 days from weekStart
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
      
      const schedules: StaffSchedule[] = [];
      for (const date of dates) {
        const q = query(
          collection(db, COLLECTIONS.schedules),
          where('staffId', '==', staffId),
          where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        schedules.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffSchedule)));
      }
      return schedules;
    },
    { enabled: !!staffId && !!weekStart }
  );
};

export const useScheduleMutations = () => {
  const queryClient = useQueryClient();

  const createSchedule = useMutation(
    async (data: Omit<StaffSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.schedules), {
        ...data,
        status: 'scheduled',
        isSwapRequest: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      },
    }
  );

  const updateSchedule = useMutation(
    async ({ id, data }: { id: string; data: Partial<StaffSchedule> }) => {
      await updateDoc(doc(db, COLLECTIONS.schedules, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      },
    }
  );

  const checkIn = useMutation(
    async ({ id, location }: { id: string; location?: string }) => {
      await updateDoc(doc(db, COLLECTIONS.schedules, id), {
        status: 'in-progress',
        checkedInAt: new Date().toISOString(),
        checkInLocation: location,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      },
    }
  );

  const checkOut = useMutation(
    async ({ id, location }: { id: string; location?: string }) => {
      await updateDoc(doc(db, COLLECTIONS.schedules, id), {
        status: 'completed',
        checkedOutAt: new Date().toISOString(),
        checkOutLocation: location,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      },
    }
  );

  const deleteSchedule = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.schedules, id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      },
    }
  );

  return { createSchedule, updateSchedule, checkIn, checkOut, deleteSchedule };
};

// Time Off Requests
export const useTimeOffRequests = (companyId?: string, filters?: { staffId?: string; status?: string }) => {
  return useQuery(
    ['timeOffRequests', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.timeOff), orderBy('requestedAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.staffId) {
        q = query(q, where('staffId', '==', filters.staffId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
    },
    { enabled: true }
  );
};

export const usePendingTimeOffCount = (companyId?: string) => {
  return useQuery(
    ['timeOffRequests', 'pending', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.timeOff), where('status', '==', 'pending'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    },
    { enabled: true }
  );
};

export const useTimeOffMutations = () => {
  const queryClient = useQueryClient();

  const createRequest = useMutation(
    async (data: Omit<TimeOffRequest, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.timeOff), {
        ...data,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timeOffRequests');
      },
    }
  );

  const approveRequest = useMutation(
    async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      await updateDoc(doc(db, COLLECTIONS.timeOff, id), {
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timeOffRequests');
      },
    }
  );

  const rejectRequest = useMutation(
    async ({ id, approvedBy, reason }: { id: string; approvedBy: string; reason: string }) => {
      await updateDoc(doc(db, COLLECTIONS.timeOff, id), {
        status: 'rejected',
        approvedBy,
        rejectionReason: reason,
        approvedAt: new Date().toISOString(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timeOffRequests');
      },
    }
  );

  return { createRequest, approveRequest, rejectRequest };
};

// Templates
export const useScheduleTemplates = (companyId?: string) => {
  return useQuery(
    ['scheduleTemplates', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.templates), where('isActive', '==', true), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleTemplate));
    },
    { enabled: true }
  );
};

// Stats
export const useSchedulingStats = (companyId?: string) => {
  return useQuery(
    ['schedulingStats', companyId],
    async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let schedulesQuery = query(collection(db, COLLECTIONS.schedules), where('date', '==', today));
      let timeOffQuery = query(collection(db, COLLECTIONS.timeOff), where('status', '==', 'pending'));
      
      if (companyId) {
        schedulesQuery = query(schedulesQuery, where('companyId', '==', companyId));
        timeOffQuery = query(timeOffQuery, where('companyId', '==', companyId));
      }
      
      const [schedulesSnap, timeOffSnap] = await Promise.all([
        getDocs(schedulesQuery),
        getDocs(timeOffQuery),
      ]);
      
      const schedules = schedulesSnap.docs.map(d => d.data() as StaffSchedule);
      
      return {
        scheduledToday: schedules.length,
        checkedIn: schedules.filter(s => s.status === 'in-progress').length,
        completed: schedules.filter(s => s.status === 'completed').length,
        absent: schedules.filter(s => s.status === 'absent').length,
        pendingTimeOff: timeOffSnap.docs.length,
      };
    },
    { enabled: true }
  );
};
