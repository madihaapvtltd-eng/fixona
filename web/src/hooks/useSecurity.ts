import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SecurityIncident, SecurityPatrol, CCTVCheck, KeyControl, EmergencyContact, SafetyEquipment } from '@/types/security';

const COLLECTIONS = {
  incidents: 'securityIncidents',
  patrols: 'securityPatrols',
  cctvChecks: 'cctvChecks',
  keys: 'keyControl',
  emergencyContacts: 'emergencyContacts',
  safetyEquipment: 'safetyEquipment',
};

// Incidents
export const useSecurityIncidents = (companyId?: string, filters?: { status?: string; severity?: string }) => {
  return useQuery(
    ['securityIncidents', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.incidents), orderBy('reportedAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityIncident));
    },
    { enabled: true }
  );
};

export const useOpenIncidentsCount = (companyId?: string) => {
  return useQuery(
    ['securityIncidents', 'open', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.incidents), where('status', 'in', ['open', 'in-progress']));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    },
    { enabled: true }
  );
};

export const useIncidentMutations = () => {
  const queryClient = useQueryClient();

  const createIncident = useMutation(
    async (data: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Generate incident number
      const incidentNumber = `INC-${Date.now().toString(36).toUpperCase()}`;
      
      const docRef = await addDoc(collection(db, COLLECTIONS.incidents), {
        ...data,
        incidentNumber,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('securityIncidents');
      },
    }
  );

  const updateIncident = useMutation(
    async ({ id, data }: { id: string; data: Partial<SecurityIncident> }) => {
      await updateDoc(doc(db, COLLECTIONS.incidents, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('securityIncidents');
      },
    }
  );

  const resolveIncident = useMutation(
    async ({ id, outcome, resolvedBy }: { id: string; outcome: string; resolvedBy: string }) => {
      await updateDoc(doc(db, COLLECTIONS.incidents, id), {
        status: 'resolved',
        outcome,
        resolvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('securityIncidents');
      },
    }
  );

  return { createIncident, updateIncident, resolveIncident };
};

// Patrols
export const useSecurityPatrols = (companyId?: string, date?: string) => {
  return useQuery(
    ['securityPatrols', companyId, date],
    async () => {
      let q = query(collection(db, COLLECTIONS.patrols), orderBy('scheduledStart', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (date) {
        q = query(q, where('scheduledStart', '>=', date), where('scheduledStart', '<=', date + '\uf8ff'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityPatrol));
    },
    { enabled: true }
  );
};

// CCTV
export const useCCTVChecks = (companyId?: string, limit: number = 30) => {
  return useQuery(
    ['cctvChecks', companyId, limit],
    async () => {
      let q = query(collection(db, COLLECTIONS.cctvChecks), orderBy('checkDate', 'desc'), orderBy('checkTime', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as CCTVCheck));
    },
    { enabled: true }
  );
};

// Keys
export const useKeyControl = (companyId?: string, status?: string) => {
  return useQuery(
    ['keyControl', companyId, status],
    async () => {
      let q = query(collection(db, COLLECTIONS.keys), orderBy('keyNumber', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (status) {
        q = query(q, where('status', '==', status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KeyControl));
    },
    { enabled: true }
  );
};

export const useKeyMutations = () => {
  const queryClient = useQueryClient();

  const issueKey = useMutation(
    async ({ id, issuedTo, issuedToName }: { id: string; issuedTo: string; issuedToName: string }) => {
      const now = new Date().toISOString();
      const docRef = doc(db, COLLECTIONS.keys, id);
      const snapshot = await getDoc(docRef);
      const key = snapshot.data() as KeyControl;
      
      const historyEntry = {
        issuedTo,
        issuedAt: now,
      };
      
      await updateDoc(docRef, {
        status: 'issued',
        issuedTo,
        issuedToName,
        issuedAt: now,
        issueHistory: [...(key.issueHistory || []), historyEntry],
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('keyControl');
      },
    }
  );

  const returnKey = useMutation(
    async ({ id }: { id: string }) => {
      const docRef = doc(db, COLLECTIONS.keys, id);
      const snapshot = await getDoc(docRef);
      const key = snapshot.data() as KeyControl;
      
      // Update the last history entry with return time
      const history = key.issueHistory || [];
      if (history.length > 0) {
        history[history.length - 1].returnedAt = new Date().toISOString();
      }
      
      await updateDoc(docRef, {
        status: 'available',
        issuedTo: null,
        issuedToName: null,
        issuedAt: null,
        issueHistory: history,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('keyControl');
      },
    }
  );

  return { issueKey, returnKey };
};

// Emergency Contacts
export const useEmergencyContacts = (companyId?: string) => {
  return useQuery(
    ['emergencyContacts', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.emergencyContacts), where('isActive', '==', true), orderBy('priority', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyContact));
    },
    { enabled: true }
  );
};

// Safety Equipment
export const useSafetyEquipment = (companyId?: string, dueInspection?: boolean) => {
  return useQuery(
    ['safetyEquipment', companyId, dueInspection],
    async () => {
      let q = query(collection(db, COLLECTIONS.safetyEquipment), orderBy('location', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      let equipment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyEquipment));
      
      if (dueInspection) {
        const today = new Date().toISOString().split('T')[0];
        equipment = equipment.filter(e => e.nextInspection <= today);
      }
      
      return equipment;
    },
    { enabled: true }
  );
};

// Stats
export const useSecurityStats = (companyId?: string) => {
  return useQuery(
    ['securityStats', companyId],
    async () => {
      let incidentsQuery = query(collection(db, COLLECTIONS.incidents));
      let patrolsQuery = query(collection(db, COLLECTIONS.patrols));
      let equipmentQuery = query(collection(db, COLLECTIONS.safetyEquipment));
      let keysQuery = query(collection(db, COLLECTIONS.keys));
      
      const today = new Date().toISOString().split('T')[0];
      
      if (companyId) {
        incidentsQuery = query(incidentsQuery, where('companyId', '==', companyId));
        patrolsQuery = query(patrolsQuery, where('companyId', '==', companyId));
        equipmentQuery = query(equipmentQuery, where('companyId', '==', companyId));
        keysQuery = query(keysQuery, where('companyId', '==', companyId));
      }
      
      const [incidentsSnap, patrolsSnap, equipmentSnap, keysSnap] = await Promise.all([
        getDocs(incidentsQuery),
        getDocs(patrolsQuery),
        getDocs(equipmentQuery),
        getDocs(keysQuery),
      ]);
      
      const incidents = incidentsSnap.docs.map(d => d.data() as SecurityIncident);
      const equipment = equipmentSnap.docs.map(d => d.data() as SafetyEquipment);
      
      // Count due inspections
      const dueInspections = equipment.filter(e => e.nextInspection <= today).length;
      
      // Count expired items
      const expiredItems = equipment.filter(e => e.expiryDate && e.expiryDate < today).length;
      
      return {
        totalIncidents: incidents.length,
        openIncidents: incidents.filter(i => i.status === 'open').length,
        inProgressIncidents: incidents.filter(i => i.status === 'in-progress').length,
        resolvedToday: incidents.filter(i => i.resolvedAt && i.resolvedAt.startsWith(today)).length,
        criticalIncidents: incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
        totalPatrols: patrolsSnap.docs.length,
        completedPatrols: patrolsSnap.docs.filter(d => d.data().status === 'completed').length,
        missedPatrols: patrolsSnap.docs.filter(d => d.data().status === 'missed').length,
        totalEquipment: equipment.length,
        operationalEquipment: equipment.filter(e => e.status === 'operational').length,
        needsService: equipment.filter(e => e.status === 'needs-service').length,
        dueInspections,
        expiredItems,
        totalKeys: keysSnap.docs.length,
        issuedKeys: keysSnap.docs.filter(d => d.data().status === 'issued').length,
        lostKeys: keysSnap.docs.filter(d => d.data().status === 'lost').length,
      };
    },
    { enabled: true }
  );
};
