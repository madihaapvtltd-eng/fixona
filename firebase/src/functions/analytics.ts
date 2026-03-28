import * as functions from 'firebase-functions';
import { db } from '../index';
import * as admin from 'firebase-admin';

// HTTP Function: Get dashboard statistics
export const getDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get counts
    const [
      assetsSnapshot,
      assetsUnderMaintenance,
      highRiskAssets,
      openWorkOrders,
      overdueWorkOrders,
      lowStockItems,
      inventorySnapshot,
      monthlyMaintenance,
    ] = await Promise.all([
      db.collection('assets').count().get(),
      db.collection('assets').where('status', '==', 'maintenance').count().get(),
      db.collection('assets').where('riskLevel', 'in', ['high', 'critical']).count().get(),
      db.collection('work_orders').where('status', 'in', ['open', 'assigned', 'in_progress']).count().get(),
      db.collection('work_orders')
        .where('status', 'in', ['open', 'assigned', 'in_progress'])
        .where('dueDate', '<', now)
        .count().get(),
      db.collection('inventory').where('quantity', '<=', 0).count().get(),
      db.collection('inventory').get(),
      db.collection('maintenance_logs')
        .where('createdAt', '>=', startOfMonth)
        .get(),
    ]);
    
    // Calculate inventory value
    let totalInventoryValue = 0;
    inventorySnapshot.forEach(doc => {
      const item = doc.data();
      totalInventoryValue += (item.quantity || 0) * (item.unitCost || 0);
    });
    
    // Calculate monthly maintenance cost
    let monthlyMaintenanceCost = 0;
    monthlyMaintenance.forEach(doc => {
      const log = doc.data();
      monthlyMaintenanceCost += log.cost || 0;
    });
    
    // Get active technicians count
    const techniciansSnapshot = await db.collection('users')
      .where('role', '==', 'technician')
      .where('isActive', '==', true)
      .get();
    
    // Calculate utilization (technicians with in-progress tasks)
    const techUtilizationPromises = techniciansSnapshot.docs.map(async (techDoc) => {
      const inProgress = await db.collection('work_orders')
        .where('assignedTo', '==', techDoc.id)
        .where('status', '==', 'in_progress')
        .count()
        .get();
      return inProgress.data().count > 0 ? 1 : 0;
    });
    
    const utilizationResults = await Promise.all(techUtilizationPromises);
    const activeTechs = utilizationResults.reduce((sum, val) => sum + val, 0);
    const technicianUtilization = techniciansSnapshot.size > 0
      ? (activeTechs / techniciansSnapshot.size) * 100
      : 0;
    
    return {
      totalAssets: assetsSnapshot.data().count,
      assetsUnderMaintenance: assetsUnderMaintenance.data().count,
      highRiskAssets: highRiskAssets.data().count,
      openWorkOrders: openWorkOrders.data().count,
      overdueWorkOrders: overdueWorkOrders.data().count,
      lowStockItems: lowStockItems.data().count,
      totalInventoryValue,
      monthlyMaintenanceCost,
      avgCompletionTime: 0, // Calculate from work orders
      technicianUtilization: Math.round(technicianUtilization),
    };
    
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get stats');
  }
});

// HTTP Function: Get work order analytics
export const getWorkOrderAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { startDate, endDate, groupBy = 'status' } = data;
  
  try {
    let query = db.collection('work_orders');
    
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }
    
    const snapshot = await query.get();
    
    // Group data
    const grouped: Record<string, { count: number; cost: number }> = {};
    
    snapshot.forEach(doc => {
      const wo = doc.data();
      const key = wo[groupBy] || 'unknown';
      
      if (!grouped[key]) {
        grouped[key] = { count: 0, cost: 0 };
      }
      
      grouped[key].count++;
      grouped[key].cost += wo.cost || 0;
    });
    
    return {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: 'Count',
          data: Object.values(grouped).map(g => g.count),
        },
        {
          label: 'Cost',
          data: Object.values(grouped).map(g => g.cost),
        },
      ],
    };
    
  } catch (error) {
    console.error('Error getting work order analytics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get analytics');
  }
});

// HTTP Function: Export data to CSV
export const exportToCSV = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { collection, filters = {} } = data;
  
  const allowedCollections = ['work_orders', 'assets', 'inventory', 'maintenance_logs'];
  
  if (!allowedCollections.includes(collection)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid collection');
  }
  
  try {
    let query: any = db.collection(collection);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.where(key, '==', value);
      }
    });
    
    const snapshot = await query.limit(10000).get();
    
    if (snapshot.empty) {
      return { csv: '' };
    }
    
    // Get headers from first document
    const firstDoc = snapshot.docs[0].data();
    const headers = Object.keys(firstDoc).filter(key => 
      typeof firstDoc[key] !== 'object' || firstDoc[key] instanceof admin.firestore.Timestamp
    );
    
    // Build CSV
    let csv = headers.join(',') + '\n';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = headers.map(header => {
        const value = data[header];
        
        // Handle timestamps
        if (value instanceof admin.firestore.Timestamp) {
          return value.toDate().toISOString();
        }
        
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value !== undefined && value !== null ? String(value) : '';
      });
      
      csv += row.join(',') + '\n';
    });
    
    return { csv };
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export');
  }
});
