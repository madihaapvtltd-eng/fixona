import * as functions from 'firebase-functions';
import { db, auth } from '../index';
import * as admin from 'firebase-admin';

// Cloud Function: Create user profile on auth creation
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`Creating profile for user ${user.uid}`);
  
  try {
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      role: 'technician', // Default role
      phone: user.phoneNumber,
      avatar: user.photoURL,
      isActive: true,
      whatsappEnabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Create initial stats
    await db.collection('user_stats').doc(user.uid).set({
      userId: user.uid,
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksPending: 0,
      avgCompletionTime: 0,
      totalCost: 0,
      rating: 0,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Profile created for user ${user.uid}`);
  } catch (error) {
    console.error(`Error creating user profile for ${user.uid}:`, error);
    throw error;
  }
});

// Cloud Function: Clean up on user deletion
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  console.log(`Cleaning up for deleted user ${user.uid}`);
  
  try {
    // Mark user as inactive instead of deleting (for audit trail)
    await db.collection('users').doc(user.uid).update({
      isActive: false,
      email: `[DELETED]${user.email}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Reassign any open work orders
    const openWOs = await db.collection('work_orders')
      .where('assignedTo', '==', user.uid)
      .where('status', 'in', ['assigned', 'in_progress'])
      .get();
    
    const batch = db.batch();
    openWOs.docs.forEach(doc => {
      batch.update(doc.ref, {
        assignedTo: null,
        status: 'open',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    
    console.log(`Cleanup completed for user ${user.uid}`);
  } catch (error) {
    console.error(`Error cleaning up user ${user.uid}:`, error);
    throw error;
  }
});

// HTTP Function: Set user role (admin only)
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const callerData = callerDoc.data();
  
  if (callerData?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles');
  }
  
  const { userId, role } = data;
  
  if (!userId || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and role required');
  }
  
  if (!['admin', 'supervisor', 'technician'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }
  
  try {
    // Update user document
    await db.collection('users').doc(userId).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Set custom claims for Firebase Auth
    await auth.setCustomUserClaims(userId, { role });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set role');
  }
});

// HTTP Function: Get user stats
export const getUserStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { userId } = data;
  const targetUserId = userId || context.auth.uid;
  
  try {
    const statsDoc = await db.collection('user_stats').doc(targetUserId).get();
    
    if (!statsDoc.exists) {
      return {
        userId: targetUserId,
        tasksCompleted: 0,
        tasksInProgress: 0,
        tasksPending: 0,
        avgCompletionTime: 0,
        totalCost: 0,
        rating: 0,
      };
    }
    
    return statsDoc.data();
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get stats');
  }
});

// HTTP Function: Bulk import assets
export const bulkImportAssets = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const callerData = callerDoc.data();
  
  if (callerData?.role !== 'admin' && callerData?.role !== 'supervisor') {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { assets } = data;
  
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'assets array required');
  }
  
  if (assets.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Maximum 500 assets per import');
  }
  
  const batch = db.batch();
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (const asset of assets) {
    try {
      const assetRef = db.collection('assets').doc();
      batch.set(assetRef, {
        id: assetRef.id,
        ...asset,
        status: asset.status || 'operational',
        condition: asset.condition || 'good',
        riskLevel: asset.riskLevel || 'low',
        totalMaintenanceCost: 0,
        downtimeHours: 0,
        failureCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to import ${asset.name || 'unnamed'}: ${error}`);
    }
  }
  
  await batch.commit();
  
  return results;
});
