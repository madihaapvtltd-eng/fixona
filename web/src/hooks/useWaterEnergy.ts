import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WaterTank, DesalinationUnit, SolarInstallation, WaterReading, EnergyReading, WaterAlert } from '@/types/waterenergy';

const COLLECTIONS = {
  tanks: 'waterTanks',
  desalination: 'desalinationUnits',
  solar: 'solarInstallations',
  waterReadings: 'waterReadings',
  energyReadings: 'energyReadings',
  alerts: 'waterEnergyAlerts',
};

// Water Tanks
export const useWaterTanks = (companyId?: string) => {
  return useQuery(
    ['waterTanks', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.tanks), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaterTank));
    },
    { enabled: true }
  );
};

export const useTankMutations = () => {
  const queryClient = useQueryClient();

  const createTank = useMutation(
    async (data: Omit<WaterTank, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.tanks), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterTanks');
      },
    }
  );

  const updateTank = useMutation(
    async ({ id, data }: { id: string; data: Partial<WaterTank> }) => {
      await updateDoc(doc(db, COLLECTIONS.tanks, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterTanks');
      },
    }
  );

  const deleteTank = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, COLLECTIONS.tanks, id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterTanks');
      },
    }
  );

  const updateTankLevel = useMutation(
    async ({ id, level, percentage }: { id: string; level: number; percentage: number }) => {
      await updateDoc(doc(db, COLLECTIONS.tanks, id), {
        currentLevel: level,
        percentageFull: percentage,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterTanks');
      },
    }
  );

  return { createTank, updateTank, deleteTank, updateTankLevel };
};

// Desalination Units
export const useDesalinationUnits = (companyId?: string) => {
  return useQuery(
    ['desalinationUnits', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.desalination), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesalinationUnit));
    },
    { enabled: true }
  );
};

export const useDesalinationMutations = () => {
  const queryClient = useQueryClient();

  const createUnit = useMutation(
    async (data: Omit<DesalinationUnit, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.desalination), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('desalinationUnits');
      },
    }
  );

  const updateUnit = useMutation(
    async ({ id, data }: { id: string; data: Partial<DesalinationUnit> }) => {
      await updateDoc(doc(db, COLLECTIONS.desalination, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('desalinationUnits');
      },
    }
  );

  return { createUnit, updateUnit };
};

// Solar Installations
export const useSolarInstallations = (companyId?: string) => {
  return useQuery(
    ['solarInstallations', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.solar), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SolarInstallation));
    },
    { enabled: true }
  );
};

export const useSolarMutations = () => {
  const queryClient = useQueryClient();

  const createSolar = useMutation(
    async (data: Omit<SolarInstallation, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.solar), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('solarInstallations');
      },
    }
  );

  const updateSolar = useMutation(
    async ({ id, data }: { id: string; data: Partial<SolarInstallation> }) => {
      await updateDoc(doc(db, COLLECTIONS.solar, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('solarInstallations');
      },
    }
  );

  return { createSolar, updateSolar };
};

// Readings
export const useWaterReadings = (tankId?: string, companyId?: string, limit: number = 30) => {
  return useQuery(
    ['waterReadings', tankId, companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.waterReadings), orderBy('readingDate', 'desc'), orderBy('readingTime', 'desc'));
      if (tankId) {
        q = query(q, where('tankId', '==', tankId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as WaterReading));
    },
    { enabled: true }
  );
};

export const useEnergyReadings = (solarId?: string, companyId?: string, limit: number = 30) => {
  return useQuery(
    ['energyReadings', solarId, companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.energyReadings), orderBy('readingDate', 'desc'), orderBy('readingTime', 'desc'));
      if (solarId) {
        q = query(q, where('solarId', '==', solarId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as EnergyReading));
    },
    { enabled: true }
  );
};

export const useReadingMutations = () => {
  const queryClient = useQueryClient();

  const createWaterReading = useMutation(
    async (data: Omit<WaterReading, 'id' | 'createdAt'>) => {
      // Update tank level
      await updateDoc(doc(db, COLLECTIONS.tanks, data.tankId), {
        currentLevel: data.level,
        percentageFull: data.percentage,
        updatedAt: serverTimestamp(),
      });
      
      const docRef = await addDoc(collection(db, COLLECTIONS.waterReadings), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterReadings');
        queryClient.invalidateQueries('waterTanks');
      },
    }
  );

  const createEnergyReading = useMutation(
    async (data: Omit<EnergyReading, 'id' | 'createdAt'>) => {
      // Update solar production if applicable
      if (data.solarId) {
        await updateDoc(doc(db, COLLECTIONS.solar, data.solarId), {
          dailyProduction: data.production,
          currentOutput: data.peakOutput || 0,
          efficiency: data.efficiency || 0,
          updatedAt: serverTimestamp(),
        });
      }
      
      const docRef = await addDoc(collection(db, COLLECTIONS.energyReadings), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('energyReadings');
        queryClient.invalidateQueries('solarInstallations');
      },
    }
  );

  return { createWaterReading, createEnergyReading };
};

// Alerts
export const useWaterEnergyAlerts = (companyId?: string, unresolvedOnly: boolean = true) => {
  return useQuery(
    ['waterEnergyAlerts', companyId, unresolvedOnly],
    async () => {
      let q = query(collection(db, COLLECTIONS.alerts), orderBy('createdAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (unresolvedOnly) {
        q = query(q, where('isResolved', '==', false));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaterAlert));
    },
    { enabled: true }
  );
};

// Stats
export const useWaterEnergyStats = (companyId?: string) => {
  return useQuery(
    ['waterEnergyStats', companyId],
    async () => {
      let tanksQuery = query(collection(db, COLLECTIONS.tanks));
      let desalQuery = query(collection(db, COLLECTIONS.desalination));
      let solarQuery = query(collection(db, COLLECTIONS.solar));
      
      if (companyId) {
        tanksQuery = query(tanksQuery, where('companyId', '==', companyId));
        desalQuery = query(desalQuery, where('companyId', '==', companyId));
        solarQuery = query(solarQuery, where('companyId', '==', companyId));
      }
      
      const [tanksSnap, desalSnap, solarSnap] = await Promise.all([
        getDocs(tanksQuery),
        getDocs(desalQuery),
        getDocs(solarQuery),
      ]);
      
      const tanks = tanksSnap.docs.map(d => d.data() as WaterTank);
      const desalUnits = desalSnap.docs.map(d => d.data() as DesalinationUnit);
      const solarUnits = solarSnap.docs.map(d => d.data() as SolarInstallation);
      
      const totalWaterCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
      const currentWaterLevel = tanks.reduce((sum, t) => sum + (t.currentLevel || 0), 0);
      const totalDailyDesalCapacity = desalUnits.reduce((sum, d) => sum + d.capacity, 0);
      const currentDesalProduction = desalUnits.reduce((sum, d) => sum + (d.dailyProduction || 0), 0);
      const totalSolarCapacity = solarUnits.reduce((sum, s) => sum + s.totalCapacity, 0);
      const currentSolarProduction = solarUnits.reduce((sum, s) => sum + (s.dailyProduction || 0), 0);
      
      return {
        tankCount: tanks.length,
        totalWaterCapacity,
        currentWaterLevel,
        waterPercentage: totalWaterCapacity > 0 ? Math.round((currentWaterLevel / totalWaterCapacity) * 100) : 0,
        desalinationCount: desalUnits.length,
        totalDailyDesalCapacity,
        currentDesalProduction,
        solarCount: solarUnits.length,
        totalSolarCapacity,
        currentSolarProduction,
        lowTanks: tanks.filter(t => t.percentageFull <= 20).length,
      };
    },
    { enabled: true }
  );
};
