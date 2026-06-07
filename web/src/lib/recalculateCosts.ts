import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Recalculate costs for all completed work orders
 * This updates existing records with the correct cost breakdown
 */
export async function recalculateAllWorkOrderCosts(): Promise<{
  updated: number;
  errors: string[];
  details: Array<{ id: string; woNumber: string; oldCost: number; newCost: number }>;
}> {
  const result = {
    updated: 0,
    errors: [] as string[],
    details: [] as Array<{ id: string; woNumber: string; oldCost: number; newCost: number }>
  };

  try {
    // Get all completed work orders
    const workOrdersRef = collection(db, 'work_orders');
    const snapshot = await getDocs(workOrdersRef);
    
    const completedWorkOrders = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'completed';
    });

    console.log(`Found ${completedWorkOrders.length} completed work orders`);

    for (const workOrderDoc of completedWorkOrders) {
      try {
        const data = workOrderDoc.data();
        const workOrderId = workOrderDoc.id;

        // Calculate parts cost from partsUsed
        const partsCost = (data.partsUsed || []).reduce((sum: number, part: any) => 
          sum + (part.totalCost || 0), 0);
        
        // Extract purchase data from workflowHistory where stage is 'need_to_buy'
        const purchaseEvents = (data.workflowHistory || []).filter((h: any) => h.stage === 'need_to_buy');
        const lastPurchaseEvent = purchaseEvents[purchaseEvents.length - 1];
        
        // Calculate purchase cost from purchaseItems in workflowHistory
        let purchaseCost = 0;
        if (lastPurchaseEvent?.purchaseItems && lastPurchaseEvent.purchaseItems.length > 0) {
          purchaseCost = lastPurchaseEvent.purchaseItems.reduce((sum: number, item: any) => 
            sum + ((item.estimatedCost || 0) * (item.quantity || 0)), 0);
        } else if (lastPurchaseEvent?.purchaseCost) {
          // Use stored purchaseCost if available
          purchaseCost = lastPurchaseEvent.purchaseCost;
        }
        
        // Use existing laborCost or default to 0
        const laborCost = data.laborCost || 0;
        
        // Calculate total cost
        const totalCost = partsCost + purchaseCost + laborCost;
        
        const oldCost = data.cost || 0;

        // Only update if cost has changed
        if (oldCost !== totalCost || !data.partsCost || !data.purchaseCost) {
          await updateDoc(doc(db, 'work_orders', workOrderId), {
            partsCost,
            purchaseCost,
            cost: totalCost,
            finalCost: totalCost,
            updatedAt: serverTimestamp()
          });

          result.updated++;
          result.details.push({
            id: workOrderId,
            woNumber: data.woNumber || 'Unknown',
            oldCost,
            newCost: totalCost
          });

          console.log(`Updated ${data.woNumber}: ${oldCost} → ${totalCost} (parts: ${partsCost}, purchase: ${purchaseCost}, labor: ${laborCost})`);
        }
      } catch (error: any) {
        const errorMsg = `Error updating work order ${workOrderDoc.id}: ${error.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching work orders:', error);
    result.errors.push(`Failed to fetch work orders: ${error.message}`);
    return result;
  }
}

/**
 * Recalculate cost for a single work order
 */
export async function recalculateWorkOrderCost(workOrderId: string): Promise<{
  success: boolean;
  oldCost: number;
  newCost: number;
  breakdown: { partsCost: number; purchaseCost: number; laborCost: number };
  error?: string;
}> {
  try {
    const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const workOrderRef = doc(db, 'work_orders', workOrderId);
    const snapshot = await getDoc(workOrderRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        oldCost: 0,
        newCost: 0,
        breakdown: { partsCost: 0, purchaseCost: 0, laborCost: 0 },
        error: 'Work order not found'
      };
    }

    const data = snapshot.data();

    // Calculate parts cost from partsUsed
    const partsCost = (data.partsUsed || []).reduce((sum: number, part: any) => 
      sum + (part.totalCost || 0), 0);
    
    // Extract purchase data from workflowHistory where stage is 'need_to_buy'
    const purchaseEvents = (data.workflowHistory || []).filter((h: any) => h.stage === 'need_to_buy');
    const lastPurchaseEvent = purchaseEvents[purchaseEvents.length - 1];
    
    // Calculate purchase cost from purchaseItems in workflowHistory
    let purchaseCost = 0;
    if (lastPurchaseEvent?.purchaseItems && lastPurchaseEvent.purchaseItems.length > 0) {
      purchaseCost = lastPurchaseEvent.purchaseItems.reduce((sum: number, item: any) => 
        sum + ((item.estimatedCost || 0) * (item.quantity || 0)), 0);
    } else if (lastPurchaseEvent?.purchaseCost) {
      purchaseCost = lastPurchaseEvent.purchaseCost;
    }
    
    // Use existing laborCost or default to 0
    const laborCost = data.laborCost || 0;
    
    // Calculate total cost
    const totalCost = partsCost + purchaseCost + laborCost;
    
    const oldCost = data.cost || 0;

    await updateDoc(workOrderRef, {
      partsCost,
      purchaseCost,
      cost: totalCost,
      finalCost: totalCost,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      oldCost,
      newCost: totalCost,
      breakdown: { partsCost, purchaseCost, laborCost }
    };
  } catch (error: any) {
    return {
      success: false,
      oldCost: 0,
      newCost: 0,
      breakdown: { partsCost: 0, purchaseCost: 0, laborCost: 0 },
      error: error.message
    };
  }
}
