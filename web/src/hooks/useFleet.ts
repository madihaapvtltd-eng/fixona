import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vehicle, Trip, FuelLog, VehicleMaintenance, Driver } from '@/types/fleet';

const COLLECTIONS = {
  vehicles: 'vehicles',
  trips: 'trips',
  fuelLogs: 'fuelLogs',
  maintenance: 'vehicleMaintenance',
  drivers: 'drivers',
};

// Vehicles
export const useVehicles = (companyId?: string, filters?: { type?: string; status?: string }) => {
  return useQuery(
    ['vehicles', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.vehicles), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.type) {
        q = query(q, where('vehicleType', '==', filters.type));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    },
    { enabled: true }
  );
};

export const useVehicle = (id: string) => {
  return useQuery(
    ['vehicle', id],
    async () => {
      const docRef = doc(db, COLLECTIONS.vehicles, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Vehicle;
    },
    { enabled: !!id }
  );
};

export const useVehicleMutations = () => {
  const queryClient = useQueryClient();

  const createVehicle = useMutation(
    async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.vehicles), {
        ...data,
        currentMileage: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles');
      },
    }
  );

  const updateVehicle = useMutation(
    async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      await updateDoc(doc(db, COLLECTIONS.vehicles, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles');
        queryClient.invalidateQueries('vehicle');
      },
    }
  );

  return { createVehicle, updateVehicle };
};

// Trips
export const useTrips = (companyId?: string, filters?: { vehicleId?: string; status?: string; driverId?: string }) => {
  return useQuery(
    ['trips', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.trips), orderBy('startTime', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.vehicleId) {
        q = query(q, where('vehicleId', '==', filters.vehicleId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.driverId) {
        q = query(q, where('driverId', '==', filters.driverId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
    },
    { enabled: true }
  );
};

export const useActiveTrips = (companyId?: string) => {
  return useQuery(
    ['trips', 'active', companyId],
    async () => {
      let q = query(
        collection(db, COLLECTIONS.trips),
        where('status', 'in', ['scheduled', 'in-progress']),
        orderBy('startTime', 'desc')
      );
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
    },
    { enabled: true }
  );
};

export const useTripMutations = () => {
  const queryClient = useQueryClient();

  const createTrip = useMutation(
    async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Update vehicle status
      await updateDoc(doc(db, COLLECTIONS.vehicles, data.vehicleId), {
        status: 'in-use',
        currentLocation: data.startLocation,
        updatedAt: serverTimestamp(),
      });
      
      const docRef = await addDoc(collection(db, COLLECTIONS.trips), {
        ...data,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trips');
        queryClient.invalidateQueries('vehicles');
      },
    }
  );

  const startTrip = useMutation(
    async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      await updateDoc(doc(db, COLLECTIONS.trips, id), {
        status: 'in-progress',
        updatedAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, COLLECTIONS.vehicles, vehicleId), {
        status: 'in-use',
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trips');
        queryClient.invalidateQueries('vehicles');
      },
    }
  );

  const completeTrip = useMutation(
    async ({ 
      id, 
      vehicleId, 
      endMileage, 
      fuelEnd,
      distance 
    }: { 
      id: string; 
      vehicleId: string;
      endMileage: number;
      fuelEnd?: number;
      distance?: number;
    }) => {
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, COLLECTIONS.trips, id), {
        status: 'completed',
        actualEnd: now,
        endMileage,
        fuelEnd,
        distance,
        updatedAt: serverTimestamp(),
      });
      
      // Update vehicle mileage and status
      await updateDoc(doc(db, COLLECTIONS.vehicles, vehicleId), {
        status: 'available',
        currentMileage: endMileage,
        currentLocation: null,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trips');
        queryClient.invalidateQueries('vehicles');
      },
    }
  );

  return { createTrip, startTrip, completeTrip };
};

// Drivers
export const useDrivers = (companyId?: string) => {
  return useQuery(
    ['drivers', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.drivers), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
    },
    { enabled: true }
  );
};

// Fuel Logs
export const useFuelLogs = (vehicleId?: string, companyId?: string, limit: number = 30) => {
  return useQuery(
    ['fuelLogs', vehicleId, companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.fuelLogs), orderBy('date', 'desc'), orderBy('time', 'desc'));
      if (vehicleId) {
        q = query(q, where('vehicleId', '==', vehicleId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as FuelLog));
    },
    { enabled: true }
  );
};

export const useFuelLogMutations = () => {
  const queryClient = useQueryClient();

  const createFuelLog = useMutation(
    async (data: Omit<FuelLog, 'id' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.fuelLogs), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fuelLogs');
      },
    }
  );

  return { createFuelLog };
};

// Maintenance
export const useVehicleMaintenance = (vehicleId?: string, companyId?: string) => {
  return useQuery(
    ['vehicleMaintenance', vehicleId, companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.maintenance), orderBy('serviceDate', 'desc'));
      if (vehicleId) {
        q = query(q, where('vehicleId', '==', vehicleId));
      }
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleMaintenance));
    },
    { enabled: true }
  );
};

// Stats
export const useFleetStats = (companyId?: string) => {
  return useQuery(
    ['fleetStats', companyId],
    async () => {
      let vehiclesQuery = query(collection(db, COLLECTIONS.vehicles));
      let tripsQuery = query(collection(db, COLLECTIONS.trips), where('status', 'in', ['scheduled', 'in-progress']));
      let fuelQuery = query(collection(db, COLLECTIONS.fuelLogs));
      
      const today = new Date().toISOString().split('T')[0];
      let todayFuelQuery = query(collection(db, COLLECTIONS.fuelLogs), where('date', '==', today));
      
      if (companyId) {
        vehiclesQuery = query(vehiclesQuery, where('companyId', '==', companyId));
        tripsQuery = query(tripsQuery, where('companyId', '==', companyId));
        fuelQuery = query(fuelQuery, where('companyId', '==', companyId));
        todayFuelQuery = query(todayFuelQuery, where('companyId', '==', companyId));
      }
      
      const [vehiclesSnap, tripsSnap, fuelSnap, todayFuelSnap] = await Promise.all([
        getDocs(vehiclesQuery),
        getDocs(tripsQuery),
        getDocs(fuelQuery),
        getDocs(todayFuelQuery),
      ]);
      
      const vehicles = vehiclesSnap.docs.map(d => d.data() as Vehicle);
      const fuelLogs = fuelSnap.docs.map(d => d.data() as FuelLog);
      
      const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
      const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
      const todayFuelCost = todayFuelSnap.docs.reduce((sum, doc) => sum + (doc.data().cost || 0), 0);
      
      return {
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.status === 'available').length,
        inUseVehicles: vehicles.filter(v => v.status === 'in-use').length,
        maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
        activeTrips: tripsSnap.docs.length,
        totalMileage: vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0),
        totalFuelCost,
        totalLiters,
        avgKmPerLiter: totalLiters > 0 ? 
          fuelLogs.reduce((sum, log) => sum + (log.distanceSinceLastRefuel || 0), 0) / totalLiters : 0,
        todayFuelCost,
      };
    },
    { enabled: true }
  );
};
