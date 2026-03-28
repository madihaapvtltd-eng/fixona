import * as functions from 'firebase-functions';
import { db, messaging } from '../index';
import { sendWhatsAppMessage, isWhatsAppConfigured } from './whatsapp';

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  phoneNumber?: string;
  whatsappMessage?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { userId, title, message, type, data, phoneNumber, whatsappMessage } = payload;
  
  try {
    const sentVia: string[] = [];
    
    // 1. Create in-app notification
    await db.collection('notifications').add({
      userId,
      title,
      message,
      type,
      data,
      isRead: false,
      sentVia: ['in_app'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 2. Get user's FCM token and send push notification
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.fcmToken) {
      try {
        await messaging.send({
          token: userData.fcmToken,
          notification: {
            title,
            body: message,
          },
          data: {
            type,
            ...data,
          },
        });
        sentVia.push('push');
      } catch (error) {
        console.error('FCM error:', error);
      }
    }
    
    // 3. Send WhatsApp message if configured and enabled
    if (phoneNumber && userData?.whatsappEnabled) {
      if (await isWhatsAppConfigured()) {
        try {
          await sendWhatsAppMessage({
            phoneNumber,
            message: whatsappMessage || message,
          });
          sentVia.push('whatsapp');
        } catch (error) {
          console.error('WhatsApp error:', error);
          // Log but don't fail - push notification was sent
          await db.collection('whatsapp_logs').add({
            phoneNumber,
            message: whatsappMessage || message,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } else {
        // Log the message that would have been sent
        console.log(`[WhatsApp Mock] To: ${phoneNumber}`);
        console.log(`[WhatsApp Mock] Message: ${whatsappMessage || message}`);
        await db.collection('whatsapp_logs').add({
          phoneNumber,
          message: whatsappMessage || message,
          status: 'mock_sent',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    // Update notification record with all channels used
    const notificationsRef = db.collection('notifications')
      .where('userId', '==', userId)
      .where('title', '==', title)
      .orderBy('createdAt', 'desc')
      .limit(1);
    
    const snapshot = await notificationsRef.get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ sentVia });
    }
    
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
}

// Cloud Function: Send notification on new work order assignment
export const onWorkOrderAssigned = functions.firestore
  .document('work_orders/{workOrderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if assignedTo changed
    if (newData.assignedTo && newData.assignedTo !== oldData.assignedTo) {
      const workOrderId = context.params.workOrderId;
      
      // Get assigned user details
      const userDoc = await db.collection('users').doc(newData.assignedTo).get();
      const userData = userDoc.data();
      
      if (userData) {
        // Send notification
        await sendNotification({
          userId: newData.assignedTo,
          title: 'New Work Order Assigned',
          message: `You have been assigned: ${newData.title}`,
          type: 'work_order',
          data: {
            workOrderId,
            priority: newData.priority,
            dueDate: newData.dueDate?.toDate?.()?.toISOString(),
          },
          phoneNumber: userData.phone,
          whatsappMessage: `🔧 *New Task Assigned*\n\n` +
            `*Work Order:* ${newData.woNumber}\n` +
            `*Title:* ${newData.title}\n` +
            `*Priority:* ${newData.priority.toUpperCase()}\n` +
            `*Due:* ${newData.dueDate?.toDate?.()?.toLocaleDateString() || 'Not set'}\n\n` +
            `Please check your app for details.`,
        });
        
        // Create work order history entry
        await db.collection('work_order_history').add({
          workOrderId,
          action: 'assigned',
          statusFrom: oldData.status,
          statusTo: newData.status,
          userId: newData.assignedTo,
          userName: userData.name,
          notes: `Assigned to ${userData.name}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    return null;
  });

// Cloud Function: Notify on high priority work order
export const onHighPriorityWorkOrder = functions.firestore
  .document('work_orders/{workOrderId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    if (data.priority === 'critical' || data.priority === 'high') {
      // Get all supervisors and admins
      const supervisors = await db.collection('users')
        .where('role', 'in', ['admin', 'supervisor'])
        .where('isActive', '==', true)
        .get();
      
      const notifications = supervisors.docs.map(async (doc) => {
        const userData = doc.data();
        return sendNotification({
          userId: doc.id,
          title: `⚠️ High Priority Work Order`,
          message: `${data.priority.toUpperCase()}: ${data.title}`,
          type: 'alert',
          data: {
            workOrderId: context.params.workOrderId,
            priority: data.priority,
          },
          phoneNumber: userData.phone,
          whatsappMessage: `⚠️ *High Priority Alert*\n\n` +
            `A ${data.priority.toUpperCase()} priority work order has been created.\n\n` +
            `*WO:* ${data.woNumber}\n` +
            `*Asset:* ${data.assetName || 'N/A'}\n` +
            `*Issue:* ${data.description?.substring(0, 100)}${data.description?.length > 100 ? '...' : ''}`,
        });
      });
      
      await Promise.all(notifications);
    }
    
    return null;
  });

// Import admin for FieldValue
import * as admin from 'firebase-admin';
