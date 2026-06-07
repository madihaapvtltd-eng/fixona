import * as functions from 'firebase-functions';
import { db } from '../index';
import { sendNotification } from './notifications';
import * as admin from 'firebase-admin';

// Cloud Function: Handle inventory deduction when work order is completed
export const onWorkOrderComplete = functions.firestore
  .document('work_orders/{workOrderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if work order was just completed
    if (newData.status === 'completed' && oldData.status !== 'completed') {
      console.log(`Work order ${context.params.workOrderId} completed, processing inventory...`);
      
      const partsUsed = newData.partsUsed || [];
      
      for (const part of partsUsed) {
        try {
          // Get inventory item
          const inventoryRef = db.collection('inventory').doc(part.partId);
          const inventoryDoc = await inventoryRef.get();
          
          if (!inventoryDoc.exists) {
            console.error(`Inventory item ${part.partId} not found`);
            continue;
          }
          
          const inventoryData = inventoryDoc.data();
          const previousQuantity = inventoryData?.quantity || 0;
          const newQuantity = previousQuantity - part.quantity;
          
          // Update inventory quantity
          await inventoryRef.update({
            quantity: newQuantity,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Create inventory log
          await db.collection('inventory_logs').add({
            partId: part.partId,
            type: 'out',
            quantity: part.quantity,
            previousQuantity,
            newQuantity,
            referenceType: 'work_order',
            referenceId: context.params.workOrderId,
            notes: `Used in work order ${newData.woNumber}`,
            userId: newData.assignedTo || 'system',
            userName: newData.assignedToName || 'System',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Check if stock is low
          const minThreshold = inventoryData?.minThreshold || 0;
          if (newQuantity <= minThreshold) {
            // Notify supervisors about low stock
            const supervisors = await db.collection('users')
              .where('role', 'in', ['admin', 'supervisor'])
              .where('isActive', '==', true)
              .get();
            
            await Promise.all(
              supervisors.docs.map(userDoc => {
                const userData = userDoc.data();
                return sendNotification({
                  userId: userDoc.id,
                  title: '⚠️ Low Stock Alert',
                  message: `${part.name} is running low (${newQuantity} remaining)`,
                  type: 'inventory',
                  data: {
                    partId: part.partId,
                    currentQuantity: newQuantity,
                    minThreshold,
                  },
                  phoneNumber: userData.phone,
                  whatsappMessage: `⚠️ *Low Stock Alert*\n\n` +
                    `Part: *${part.name}*\n` +
                    `Part #: ${inventoryData?.partNumber || 'N/A'}\n` +
                    `Current Stock: *${newQuantity}*\n` +
                    `Min Threshold: ${minThreshold}\n\n` +
                    `Please reorder soon.`,
                });
              })
            );
          }
          
          console.log(`Deducted ${part.quantity} of ${part.name} from inventory`);
          
        } catch (error) {
          console.error(`Error processing inventory for part ${part.partId}:`, error);
        }
      }
      
      // Update user stats
      if (newData.assignedTo) {
        const userStatsRef = db.collection('user_stats').doc(newData.assignedTo);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
          const stats = userStatsDoc.data();
          const completionTime = newData.startedAt && newData.completedAt
            ? (newData.completedAt.toDate().getTime() - newData.startedAt.toDate().getTime()) / (1000 * 60)
            : 0;
          
          await userStatsRef.update({
            tasksCompleted: (stats?.tasksCompleted || 0) + 1,
            tasksInProgress: Math.max(0, (stats?.tasksInProgress || 0) - 1),
            avgCompletionTime: stats?.avgCompletionTime
              ? (stats.avgCompletionTime * stats.tasksCompleted + completionTime) / (stats.tasksCompleted + 1)
              : completionTime,
            totalCost: (stats?.totalCost || 0) + (newData.cost || 0),
            lastActive: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Create initial stats
          await userStatsRef.set({
            userId: newData.assignedTo,
            tasksCompleted: 1,
            tasksInProgress: 0,
            tasksPending: 0,
            avgCompletionTime: 0,
            totalCost: newData.cost || 0,
            rating: 0,
            lastActive: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      // Create maintenance log
      await db.collection('maintenance_logs').add({
        assetId: newData.assetId,
        workOrderId: context.params.workOrderId,
        type: newData.type,
        description: newData.description,
        performedBy: newData.assignedTo || 'system',
        performedByName: newData.assignedToName || 'System',
        startedAt: newData.startedAt,
        completedAt: newData.completedAt,
        duration: newData.actualDuration,
        cost: newData.cost,
        partsUsed: partsUsed.map((p: any) => ({
          partId: p.partId,
          name: p.name,
          quantity: p.quantity,
          unitCost: p.unitCost,
        })),
        laborHours: (newData.actualDuration || 0) / 60,
        downtime: newData.actualDuration || 0,
        notes: newData.completionNotes,
        images: newData.images,
        documents: newData.attachments,
        resolution: newData.resolution,
        nextMaintenanceDate: newData.nextMaintenanceDate,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update asset last maintenance date
      await db.collection('assets').doc(newData.assetId).update({
        lastMaintenanceDate: newData.completedAt,
        status: 'operational',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Create work order history entry
      await db.collection('work_order_history').add({
        workOrderId: context.params.workOrderId,
        action: 'completed',
        statusFrom: oldData.status,
        statusTo: 'completed',
        userId: newData.assignedTo || 'system',
        userName: newData.assignedToName || 'System',
        notes: newData.completionNotes || 'Work order completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`Work order ${context.params.workOrderId} completion processed successfully`);
    }
    
    return null;
  });

// Cloud Function: Check overdue work orders and send alerts
export const checkOverdueWorkOrders = functions.pubsub
  .schedule('0 8 * * *') // Run daily at 8 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Checking for overdue work orders...');
    
    const now = new Date();
    
    try {
      // Find overdue work orders
      const overdueWOs = await db.collection('work_orders')
        .where('status', 'in', ['open', 'assigned', 'in_progress'])
        .where('dueDate', '<', now)
        .get();
      
      console.log(`Found ${overdueWOs.size} overdue work orders`);
      
      for (const woDoc of overdueWOs.docs) {
        const wo = woDoc.data();
        
        // Get supervisors to notify
        const supervisors = await db.collection('users')
          .where('role', 'in', ['admin', 'supervisor'])
          .where('isActive', '==', true)
          .get();
        
        const notifications = supervisors.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          return sendNotification({
            userId: userDoc.id,
            title: '⏰ Overdue Work Order Alert',
            message: `Work order ${wo.woNumber} is overdue`,
            type: 'alert',
            data: {
              workOrderId: woDoc.id,
              woNumber: wo.woNumber,
              dueDate: wo.dueDate?.toDate?.()?.toISOString(),
            },
            phoneNumber: userData.phone,
            whatsappMessage: `⏰ *Overdue Work Order*\n\n` +
              `WO: *${wo.woNumber}*\n` +
              `Title: ${wo.title}\n` +
              `Due Date: ${wo.dueDate?.toDate?.()?.toLocaleDateString()}\n` +
              `Status: ${wo.status}\n\n` +
              `Please take immediate action.`,
          });
        });
        
        // Also notify assigned technician
        if (wo.assignedTo) {
          const techDoc = await db.collection('users').doc(wo.assignedTo).get();
          const techData = techDoc.data();
          
          if (techData) {
            notifications.push(
              sendNotification({
                userId: wo.assignedTo,
                title: '⏰ Your Work Order is Overdue',
                message: `Work order ${wo.woNumber} was due on ${wo.dueDate?.toDate?.()?.toLocaleDateString()}`,
                type: 'alert',
                data: {
                  workOrderId: woDoc.id,
                  woNumber: wo.woNumber,
                },
                phoneNumber: techData.phone,
                whatsappMessage: `⏰ *Overdue Task Reminder*\n\n` +
                  `Your work order is overdue:\n` +
                  `WO: *${wo.woNumber}*\n` +
                  `Title: ${wo.title}\n` +
                  `Due: ${wo.dueDate?.toDate?.()?.toLocaleDateString()}\n\n` +
                  `Please complete or update status.`,
              })
            );
          }
        }
        
        await Promise.all(notifications);
      }
      
      console.log('Overdue work order check completed');
      return null;
      
    } catch (error) {
      console.error('Error checking overdue work orders:', error);
      throw error;
    }
  });
