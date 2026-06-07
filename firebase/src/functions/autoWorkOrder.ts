import * as functions from 'firebase-functions';
import { db } from '../index';
import { sendNotification } from './notifications';
import * as admin from 'firebase-admin';

// Cloud Function: Auto-generate work orders for maintenance due dates
export const autoGenerateWorkOrders = functions.pubsub
  .schedule('0 6 * * *') // Run daily at 6 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running auto work order generation...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      // Find assets with maintenance due
      const assetsDue = await db.collection('assets')
        .where('nextMaintenanceDate', '>=', today)
        .where('nextMaintenanceDate', '<', tomorrow)
        .where('status', 'in', ['operational', 'maintenance'])
        .get();
      
      console.log(`Found ${assetsDue.size} assets with maintenance due`);
      
      const workOrders = assetsDue.docs.map(async (assetDoc) => {
        const asset = assetDoc.data();
        
        // Check if work order already exists for this asset
        const existingWO = await db.collection('work_orders')
          .where('assetId', '==', assetDoc.id)
          .where('type', '==', 'preventive')
          .where('status', 'in', ['open', 'assigned', 'in_progress'])
          .limit(1)
          .get();
        
        if (!existingWO.empty) {
          console.log(`Work order already exists for asset ${assetDoc.id}`);
          return null;
        }
        
        // Generate work order number
        const woCount = await db.collection('work_orders').count().get();
        const woNumber = `WO-${new Date().getFullYear()}-${String(woCount.data().count + 1).padStart(5, '0')}`;
        
        // Create work order
        const workOrderRef = db.collection('work_orders').doc();
        await workOrderRef.set({
          id: workOrderRef.id,
          woNumber,
          assetId: assetDoc.id,
          title: `Scheduled Maintenance - ${asset.name}`,
          description: `Preventive maintenance due for ${asset.name} (${asset.assetCode})`,
          type: 'preventive',
          priority: 'medium',
          status: 'open',
          createdBy: 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          dueDate: asset.nextMaintenanceDate,
          cost: 0,
          laborCost: 0,
          partsCost: 0,
          images: [],
          attachments: [],
          partsUsed: [],
        });
        
        // Update asset status
        await assetDoc.ref.update({
          status: 'maintenance',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Created work order ${woNumber} for asset ${assetDoc.id}`);
        
        // Notify supervisors
        const supervisors = await db.collection('users')
          .where('role', 'in', ['admin', 'supervisor'])
          .where('isActive', '==', true)
          .get();
        
        await Promise.all(
          supervisors.docs.map(userDoc => 
            sendNotification({
              userId: userDoc.id,
              title: 'Auto-Generated Work Order',
              message: `Preventive maintenance work order created for ${asset.name}`,
              type: 'work_order',
              data: {
                workOrderId: workOrderRef.id,
                woNumber,
                assetId: assetDoc.id,
              },
            })
          )
        );
        
        return workOrderRef.id;
      });
      
      const results = await Promise.all(workOrders);
      const created = results.filter(id => id !== null);
      
      console.log(`Created ${created.length} work orders`);
      return null;
      
    } catch (error) {
      console.error('Error in autoGenerateWorkOrders:', error);
      throw error;
    }
  });

// Cloud Function: AI Risk Assessment and Predictive Work Orders
export const aiRiskAssessment = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running AI risk assessment...');
    
    try {
      // Get all assets
      const assetsSnapshot = await db.collection('assets').get();
      
      for (const assetDoc of assetsSnapshot.docs) {
        const asset = assetDoc.data();
        
        // Skip retired assets
        if (asset.status === 'retired') continue;
        
        // Get maintenance history
        const maintenanceHistory = await db.collection('maintenance_logs')
          .where('assetId', '==', assetDoc.id)
          .orderBy('performedAt', 'desc')
          .limit(10)
          .get();
        
        // Simple AI scoring algorithm
        let riskScore = 0;
        const factors: string[] = [];
        
        // Factor 1: Age of asset
        if (asset.purchaseDate) {
          const ageYears = (new Date().getTime() - asset.purchaseDate.toDate().getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (ageYears > 10) {
            riskScore += 20;
            factors.push('Asset is over 10 years old');
          } else if (ageYears > 5) {
            riskScore += 10;
            factors.push('Asset is over 5 years old');
          }
        }
        
        // Factor 2: Recent failures
        const recentFailures = maintenanceHistory.docs.filter(
          log => log.data().type === 'corrective' || log.data().type === 'emergency'
        );
        if (recentFailures.length >= 3) {
          riskScore += 30;
          factors.push('Multiple recent failures');
        } else if (recentFailures.length >= 1) {
          riskScore += 10;
          factors.push('Recent failure detected');
        }
        
        // Factor 3: Maintenance overdue
        if (asset.nextMaintenanceDate && asset.nextMaintenanceDate.toDate() < new Date()) {
          riskScore += 25;
          factors.push('Maintenance overdue');
        }
        
        // Factor 4: High downtime
        if (asset.downtimeHours > 100) {
          riskScore += 15;
          factors.push('High downtime recorded');
        }
        
        // Factor 5: Current condition
        if (asset.condition === 'poor') {
          riskScore += 20;
          factors.push('Asset in poor condition');
        } else if (asset.condition === 'fair') {
          riskScore += 10;
          factors.push('Asset condition is fair');
        }
        
        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (riskScore >= 70) {
          riskLevel = 'critical';
        } else if (riskScore >= 50) {
          riskLevel = 'high';
        } else if (riskScore >= 30) {
          riskLevel = 'medium';
        }
        
        // Update asset risk level
        await assetDoc.ref.update({
          riskLevel,
          aiRiskScore: riskScore,
          aiRiskFactors: factors,
          aiAssessmentDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Create predictive work order for high/critical risk
        if (riskLevel === 'high' || riskLevel === 'critical') {
          // Check if predictive work order already exists
          const existingPredictive = await db.collection('work_orders')
            .where('assetId', '==', assetDoc.id)
            .where('type', '==', 'predictive')
            .where('status', 'in', ['open', 'assigned', 'in_progress'])
            .limit(1)
            .get();
          
          if (existingPredictive.empty) {
            const woCount = await db.collection('work_orders').count().get();
            const woNumber = `WO-PRED-${new Date().getFullYear()}-${String(woCount.data().count + 1).padStart(5, '0')}`;
            
            const workOrderRef = db.collection('work_orders').doc();
            await workOrderRef.set({
              id: workOrderRef.id,
              woNumber,
              assetId: assetDoc.id,
              title: `AI Predicted Maintenance - ${asset.name}`,
              description: `AI system predicts ${riskLevel.toUpperCase()} risk for ${asset.name}.\n\nRisk Factors:\n${factors.map(f => `- ${f}`).join('\n')}\n\nRecommended action: Inspect and perform preventive maintenance.`,
              type: 'predictive',
              priority: riskLevel === 'critical' ? 'critical' : 'high',
              status: 'open',
              createdBy: 'system_ai',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              dueDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // Due in 2 days
              cost: 0,
              laborCost: 0,
              partsCost: 0,
              images: [],
              attachments: [],
              partsUsed: [],
              aiPrediction: {
                riskLevel,
                score: riskScore,
                factors,
                confidence: Math.min(riskScore / 100 + 0.3, 0.95),
              },
            });
            
            // Notify admins and supervisors
            const supervisors = await db.collection('users')
              .where('role', 'in', ['admin', 'supervisor'])
              .where('isActive', '==', true)
              .get();
            
            await Promise.all(
              supervisors.docs.map(userDoc => {
                const userData = userDoc.data();
                return sendNotification({
                  userId: userDoc.id,
                  title: `🤖 AI Alert: ${riskLevel.toUpperCase()} Risk Detected`,
                  message: `Asset ${asset.name} flagged by AI for ${riskLevel} risk level`,
                  type: 'alert',
                  data: {
                    workOrderId: workOrderRef.id,
                    assetId: assetDoc.id,
                    riskLevel,
                    riskScore,
                  },
                  phoneNumber: userData.phone,
                  whatsappMessage: `🤖 *AI Risk Alert*\n\n` +
                    `Asset: *${asset.name}*\n` +
                    `Risk Level: *${riskLevel.toUpperCase()}*\n` +
                    `Score: ${riskScore}/100\n\n` +
                    `A predictive work order has been automatically created.`,
                });
              })
            );
            
            console.log(`Created predictive work order ${woNumber} for asset ${assetDoc.id}`);
          }
        }
      }
      
      console.log('AI risk assessment completed');
      return null;
      
    } catch (error) {
      console.error('Error in aiRiskAssessment:', error);
      throw error;
    }
  });
