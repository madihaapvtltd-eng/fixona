// Push Notification Manager
// Handles registering for and receiving push notifications

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key from FCM

class PushNotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  async init(): Promise<boolean> {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return false;
    }

    // Check if push notifications are supported
    if (!('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.ts');
      console.log('Service Worker registered:', this.swRegistration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });

        console.log('Push subscription created:', subscription);

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
      } else {
        console.log('Already subscribed to push notifications');
      }

      this.pushSubscription = subscription;
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.pushSubscription) {
      return false;
    }

    try {
      await this.pushSubscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.pushSubscription);
      this.pushSubscription = null;
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send subscription to your backend
    // This will be stored and used to send push notifications
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to save push subscription:', error);
    }
  }

  async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (when app is open)
  showLocalNotification(title: string, options: NotificationOptions): void {
    if (!this.swRegistration) {
      console.error('Service worker not registered');
      return;
    }

    this.swRegistration.showNotification(title, {
      ...options,
      badge: '/fixora-badge.png',
      icon: '/fixora-logo.png',
    });
  }

  // Check if push is supported
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Hook for React components
export function usePushNotifications() {
  return {
    init: () => pushNotificationManager.init(),
    requestPermission: () => pushNotificationManager.requestPermission(),
    subscribe: () => pushNotificationManager.subscribeToPush(),
    unsubscribe: () => pushNotificationManager.unsubscribe(),
    showNotification: (title: string, options: NotificationOptions) => 
      pushNotificationManager.showLocalNotification(title, options),
    isSupported: pushNotificationManager.isPushSupported(),
    permission: pushNotificationManager.getPermissionStatus(),
  };
}
