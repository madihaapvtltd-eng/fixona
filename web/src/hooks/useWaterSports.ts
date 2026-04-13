import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WaterSportsEquipment, RentalRecord, MarineVessel, VesselTrip, EquipmentMaintenance } from '@/types/watersports';

const COLLECTIONS = {
  equipment: 'waterSportsEquipment',
  rentals: 'equipmentRentals',
  vessels: 'marineVessels',
  trips: 'vesselTrips',
  maintenance: 'equipmentMaintenance',
};

// Equipment
export const useWaterSportsEquipment = (companyId?: string, filters?: { type?: string; status?: string }) => {
  return useQuery(
    ['waterSportsEquipment', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.equipment), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.type) {
        q = query(q, where('equipmentType', '==', filters.type));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaterSportsEquipment));
    },
    { enabled: true }
  );
};

export const useEquipmentMutations = () => {
  const queryClient = useQueryClient();

  const createEquipment = useMutation(
    async (data: Omit<WaterSportsEquipment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.equipment), {
        ...data,
        totalUses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterSportsEquipment');
      },
    }
  );

  const updateEquipment = useMutation(
    async ({ id, data }: { id: string; data: Partial<WaterSportsEquipment> }) => {
      await updateDoc(doc(db, COLLECTIONS.equipment, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('waterSportsEquipment');
      },
    }
  );

  return { createEquipment, updateEquipment };
};

// Rentals
export const useRentalRecords = (companyId?: string, filters?: { status?: string; equipmentId?: string }) => {
  return useQuery(
    ['rentalRecords', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.rentals), orderBy('startTime', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.equipmentId) {
        q = query(q, where('equipmentId', '==', filters.equipmentId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalRecord));
    },
    { enabled: true }
  );
};

export const useActiveRentals = (companyId?: string) => {
  return useQuery(
    ['rentalRecords', 'active', companyId],
    async () => {
      let q = query(
        collection(db, COLLECTIONS.rentals),
        where('status', '==', 'active'),
        orderBy('startTime', 'desc')
      );
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalRecord));
    },
    { enabled: true }
  );
};

export const useRentalMutations = () => {
  const queryClient = useQueryClient();

  const createRental = useMutation(
    async (data: Omit<RentalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Update equipment status to in-use
      await updateDoc(doc(db, COLLECTIONS.equipment, data.equipmentId), {
        status: 'in-use',
        currentLocation: 'rented',
        updatedAt: serverTimestamp(),
      });
      
      const docRef = await addDoc(collection(db, COLLECTIONS.rentals), {
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentalRecords');
        queryClient.invalidateQueries('waterSportsEquipment');
      },
    }
  );

  const returnRental = useMutation(
    async ({ 
      id, 
      equipmentId, 
      condition, 
      damages, 
      damagePhotos, 
      lifeJacketReturned,
      receivedBy,
      receivedByName,
      damageFee 
    }: { 
      id: string;
      equipmentId: string;
      condition: string;
      damages?: string[];
      damagePhotos?: string[];
      lifeJacketReturned: boolean;
      receivedBy: string;
      receivedByName: string;
      damageFee?: number;
    }) => {
      const now = new Date().toISOString();
      
      // Update rental record
      await updateDoc(doc(db, COLLECTIONS.rentals, id), {
        status: damages && damages.length > 0 ? 'damaged' : 'returned',
        conditionIn: condition,
        damages: damages || [],
        damagePhotos: damagePhotos || [],
        lifeJacketReturned,
        receivedBy,
        receivedByName,
        actualReturnTime: now,
        damageFee: damageFee || 0,
        updatedAt: serverTimestamp(),
      });
      
      // Update equipment status
      await updateDoc(doc(db, COLLECTIONS.equipment, equipmentId), {
        status: 'available',
        condition: damages && damages.length > 0 ? 'damaged' : condition,
        currentLocation: null,
        totalUses: 1, // Increment in actual implementation
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentalRecords');
        queryClient.invalidateQueries('waterSportsEquipment');
      },
    }
  );

  return { createRental, returnRental };
};

// Vessels
export const useMarineVessels = (companyId?: string) => {
  return useQuery(
    ['marineVessels', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.vessels), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarineVessel));
    },
    { enabled: true }
  );
};

export const useVesselMutations = () => {
  const queryClient = useQueryClient();

  const createVessel = useMutation(
    async (data: Omit<MarineVessel, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.vessels), {
        ...data,
        totalHours: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('marineVessels');
      },
    }
  );

  return { createVessel };
};

// Trips
export const useVesselTrips = (companyId?: string, filters?: { vesselId?: string; status?: string }) => {
  return useQuery(
    ['vesselTrips', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.trips), orderBy('departureTime', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.vesselId) {
        q = query(q, where('vesselId', '==', filters.vesselId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VesselTrip));
    },
    { enabled: true }
  );
};

export const useTripMutations = () => {
  const queryClient = useQueryClient();

  const createTrip = useMutation(
    async (data: Omit<VesselTrip, 'id' | 'createdAt'>) => {
      // Update vessel status
      await updateDoc(doc(db, COLLECTIONS.vessels, data.vesselId), {
        status: 'in-use',
        currentLocation: 'at-sea',
        updatedAt: serverTimestamp(),
      });
      
      const docRef = await addDoc(collection(db, COLLECTIONS.trips), {
        ...data,
        status: 'departed',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vesselTrips');
        queryClient.invalidateQueries('marineVessels');
      },
    }
  );

  const completeTrip = useMutation(
    async ({ id, vesselId, fuelEnd, fuelUsed }: { id: string; vesselId: string; fuelEnd: number; fuelUsed: number }) => {
      await updateDoc(doc(db, COLLECTIONS.trips, id), {
        status: 'completed',
        actualReturn: new Date().toISOString(),
        fuelEnd,
        fuelUsed,
      });
      
      // Update vessel status
      const vesselDoc = await getDoc(doc(db, COLLECTIONS.vessels, vesselId));
      const vessel = vesselDoc.data() as MarineVessel;
      
      await updateDoc(doc(db, COLLECTIONS.vessels, vesselId), {
        status: 'docked',
        currentLocation: vessel.mooringLocation,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vesselTrips');
        queryClient.invalidateQueries('marineVessels');
      },
    }
  );

  return { createTrip, completeTrip };
};

// Maintenance
export const useMaintenanceRecords = (companyId?: string, equipmentId?: string) => {
  return useQuery(
    ['equipmentMaintenance', companyId, equipmentId],
    async () => {
      let q = query(collection(db, COLLECTIONS.maintenance), orderBy('date', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (equipmentId) {
        q = query(q, where('equipmentId', '==', equipmentId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentMaintenance));
    },
    { enabled: true }
  );
};

// Stats
export const useWaterSportsStats = (companyId?: string) => {
  return useQuery(
    ['waterSportsStats', companyId],
    async () => {
      let equipQuery = query(collection(db, COLLECTIONS.equipment));
      let vesselQuery = query(collection(db, COLLECTIONS.vessels));
      let rentalsQuery = query(collection(db, COLLECTIONS.rentals), where('status', '==', 'active'));
      let tripsQuery = query(collection(db, COLLECTIONS.trips), where('status', 'in', ['scheduled', 'departed']));
      
      if (companyId) {
        equipQuery = query(equipQuery, where('companyId', '==', companyId));
        vesselQuery = query(vesselQuery, where('companyId', '==', companyId));
        rentalsQuery = query(rentalsQuery, where('companyId', '==', companyId));
        tripsQuery = query(tripsQuery, where('companyId', '==', companyId));
      }
      
      const [equipSnap, vesselSnap, rentalsSnap, tripsSnap] = await Promise.all([
        getDocs(equipQuery),
        getDocs(vesselQuery),
        getDocs(rentalsQuery),
        getDocs(tripsQuery),
      ]);
      
      const equipment = equipSnap.docs.map(d => d.data() as WaterSportsEquipment);
      const vessels = vesselSnap.docs.map(d => d.data() as MarineVessel);
      
      return {
        totalEquipment: equipment.length,
        availableEquipment: equipment.filter(e => e.status === 'available').length,
        inUseEquipment: equipment.filter(e => e.status === 'in-use').length,
        maintenanceEquipment: equipment.filter(e => e.status === 'maintenance').length,
        totalVessels: vessels.length,
        operationalVessels: vessels.filter(v => v.status === 'operational').length,
        activeRentals: rentalsSnap.docs.length,
        activeTrips: tripsSnap.docs.length,
      };
    },
    { enabled: true }
  );
};
