import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GuestRequest, ConciergeService, GuestFeedback, LostFound, VipGuest, GuestSurvey } from '@/types/guestexperience';

const COLLECTIONS = {
  requests: 'guestRequests',
  services: 'conciergeServices',
  feedback: 'guestFeedback',
  lostFound: 'lostFound',
  vipGuests: 'vipGuests',
  surveys: 'guestSurveys',
};

// Guest Requests
export const useGuestRequests = (companyId?: string, filters?: { status?: string; type?: string; assignedTo?: string }) => {
  return useQuery(
    ['guestRequests', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.requests), orderBy('requestedAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.type) {
        q = query(q, where('requestType', '==', filters.type));
      }
      if (filters?.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestRequest));
    },
    { enabled: true }
  );
};

export const usePendingRequestsCount = (companyId?: string) => {
  return useQuery(
    ['guestRequests', 'pending', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.requests), where('status', 'in', ['pending', 'acknowledged', 'in-progress']));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    },
    { enabled: true }
  );
};

export const useRequestMutations = () => {
  const queryClient = useQueryClient();

  const createRequest = useMutation(
    async (data: Omit<GuestRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.requests), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guestRequests');
      },
    }
  );

  const updateRequest = useMutation(
    async ({ id, data }: { id: string; data: Partial<GuestRequest> }) => {
      await updateDoc(doc(db, COLLECTIONS.requests, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guestRequests');
      },
    }
  );

  const completeRequest = useMutation(
    async ({ id, feedback, rating }: { id: string; feedback?: string; rating?: number }) => {
      await updateDoc(doc(db, COLLECTIONS.requests, id), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        guestFeedback: feedback,
        rating,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guestRequests');
      },
    }
  );

  return { createRequest, updateRequest, completeRequest };
};

// Concierge Services
export const useConciergeServices = (companyId?: string, availableOnly: boolean = true) => {
  return useQuery(
    ['conciergeServices', companyId, availableOnly],
    async () => {
      let q = query(collection(db, COLLECTIONS.services), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (availableOnly) {
        q = query(q, where('available', '==', true));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConciergeService));
    },
    { enabled: true }
  );
};

// Guest Feedback
export const useGuestFeedback = (companyId?: string, filters?: { status?: string; type?: string }) => {
  return useQuery(
    ['guestFeedback', companyId, filters],
    async () => {
      let q = query(collection(db, COLLECTIONS.feedback), orderBy('submittedAt', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.type) {
        q = query(q, where('feedbackType', '==', filters.type));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestFeedback));
    },
    { enabled: true }
  );
};

export const useNewFeedbackCount = (companyId?: string) => {
  return useQuery(
    ['guestFeedback', 'new', companyId],
    async () => {
      let q = query(collection(db, COLLECTIONS.feedback), where('status', '==', 'new'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    },
    { enabled: true }
  );
};

export const useFeedbackMutations = () => {
  const queryClient = useQueryClient();

  const createFeedback = useMutation(
    async (data: Omit<GuestFeedback, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, COLLECTIONS.feedback), {
        ...data,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guestFeedback');
      },
    }
  );

  const resolveFeedback = useMutation(
    async ({ id, followUpNotes }: { id: string; followUpNotes: string }) => {
      await updateDoc(doc(db, COLLECTIONS.feedback, id), {
        status: 'resolved',
        followUpNotes,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guestFeedback');
      },
    }
  );

  return { createFeedback, resolveFeedback };
};

// Lost & Found
export const useLostFound = (companyId?: string, status?: string) => {
  return useQuery(
    ['lostFound', companyId, status],
    async () => {
      let q = query(collection(db, COLLECTIONS.lostFound), orderBy('foundDate', 'desc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      if (status) {
        q = query(q, where('status', '==', status));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostFound));
    },
    { enabled: true }
  );
};

export const useLostFoundMutations = () => {
  const queryClient = useQueryClient();

  const createLostFound = useMutation(
    async (data: Omit<LostFound, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Generate reference number
      const storageRefNumber = `LF-${Date.now().toString(36).toUpperCase()}`;
      
      const docRef = await addDoc(collection(db, COLLECTIONS.lostFound), {
        ...data,
        storageRefNumber,
        status: 'held',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lostFound');
      },
    }
  );

  const claimItem = useMutation(
    async ({ id, claimedBy, verificationMethod }: { id: string; claimedBy: string; verificationMethod: string }) => {
      await updateDoc(doc(db, COLLECTIONS.lostFound, id), {
        status: 'claimed',
        claimedBy,
        claimedDate: new Date().toISOString(),
        verificationMethod,
        updatedAt: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lostFound');
      },
    }
  );

  return { createLostFound, claimItem };
};

// VIP Guests
export const useVipGuests = (companyId?: string, currentOnly: boolean = false) => {
  return useQuery(
    ['vipGuests', companyId, currentOnly],
    async () => {
      let q = query(collection(db, COLLECTIONS.vipGuests), orderBy('vipLevel', 'desc'), orderBy('name', 'asc'));
      if (companyId) {
        q = query(q, where('companyId', '==', companyId));
      }
      const snapshot = await getDocs(q);
      let guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipGuest));
      
      if (currentOnly) {
        const today = new Date().toISOString().split('T')[0];
        guests = guests.filter(g => g.checkIn && g.checkOut && g.checkIn <= today && g.checkOut >= today);
      }
      
      return guests;
    },
    { enabled: true }
  );
};

// Stats
export const useGuestExperienceStats = (companyId?: string) => {
  return useQuery(
    ['guestExperienceStats', companyId],
    async () => {
      let requestsQuery = query(collection(db, COLLECTIONS.requests));
      let feedbackQuery = query(collection(db, COLLECTIONS.feedback));
      let lostFoundQuery = query(collection(db, COLLECTIONS.lostFound));
      let vipQuery = query(collection(db, COLLECTIONS.vipGuests));
      
      const today = new Date().toISOString().split('T')[0];
      
      if (companyId) {
        requestsQuery = query(requestsQuery, where('companyId', '==', companyId));
        feedbackQuery = query(feedbackQuery, where('companyId', '==', companyId));
        lostFoundQuery = query(lostFoundQuery, where('companyId', '==', companyId));
        vipQuery = query(vipQuery, where('companyId', '==', companyId));
      }
      
      const [requestsSnap, feedbackSnap, lostFoundSnap, vipSnap] = await Promise.all([
        getDocs(requestsQuery),
        getDocs(feedbackQuery),
        getDocs(lostFoundQuery),
        getDocs(vipQuery),
      ]);
      
      const requests = requestsSnap.docs.map(d => d.data() as GuestRequest);
      const feedback = feedbackSnap.docs.map(d => d.data() as GuestFeedback);
      
      // Calculate average rating
      const ratings = feedback.filter(f => f.overallRating).map(f => f.overallRating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      return {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => ['pending', 'acknowledged'].includes(r.status)).length,
        inProgressRequests: requests.filter(r => r.status === 'in-progress').length,
        completedToday: requests.filter(r => r.completedAt && r.completedAt.startsWith(today)).length,
        urgentRequests: requests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length,
        totalFeedback: feedback.length,
        newFeedback: feedback.filter(f => f.status === 'new').length,
        complaints: feedback.filter(f => f.feedbackType === 'complaint' && f.status !== 'resolved').length,
        avgRating: avgRating.toFixed(1),
        heldItems: lostFoundSnap.docs.filter(d => d.data().status === 'held').length,
        totalVipGuests: vipSnap.docs.length,
        currentVipGuests: vipSnap.docs.filter(d => {
          const g = d.data() as VipGuest;
          return g.checkIn && g.checkOut && g.checkIn <= today && g.checkOut >= today;
        }).length,
      };
    },
    { enabled: true }
  );
};
