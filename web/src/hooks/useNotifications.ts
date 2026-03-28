import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';

export interface Notification {
  id: string;
  type: 'workorder_created' | 'workorder_assigned' | 'workorder_updated' | 'workorder_completed' | 'status_changed' | 'comment_added' | 'purchase_request';
  title: string;
  message: string;
  workOrderId: string;
  workOrderNumber: string;
  recipientId?: string;
  recipientRole?: string;
  createdBy: string;
  createdByName: string;
  createdAt: any;
  read: boolean;
  readAt?: any;
}

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Use separate queries to avoid composite index requirement
    // Query 1: Notifications for this specific user
    const userQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    // Query 2: Notifications for all users (broadcast)
    const broadcastQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', 'all'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribes: (() => void)[] = [];
    const allNotifications: Notification[] = [];

    // Subscribe to user-specific notifications
    const unsub1 = onSnapshot(userQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const notif = { id: doc.id, ...doc.data() } as Notification;
        const existingIndex = allNotifications.findIndex(n => n.id === notif.id);
        if (existingIndex === -1) {
          allNotifications.push(notif);
        } else {
          allNotifications[existingIndex] = notif;
        }
      });
      updateNotifications();
    });
    unsubscribes.push(unsub1);

    // Subscribe to broadcast notifications
    const unsub2 = onSnapshot(broadcastQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const notif = { id: doc.id, ...doc.data() } as Notification;
        const existingIndex = allNotifications.findIndex(n => n.id === notif.id);
        if (existingIndex === -1) {
          allNotifications.push(notif);
        } else {
          allNotifications[existingIndex] = notif;
        }
      });
      updateNotifications();
    });
    unsubscribes.push(unsub2);

    function updateNotifications() {
      // Sort by createdAt desc and take top 50
      const sorted = allNotifications
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        })
        .slice(0, 50);
      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.read).length);
      setLoading(false);
    }

    return () => unsubscribes.forEach(u => u());
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date().toISOString(),
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          readAt: new Date().toISOString(),
        })
      )
    );
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

// Function to create a notification
export async function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: serverTimestamp(),
    read: false,
  });
}
