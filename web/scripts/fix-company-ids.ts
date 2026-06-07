/**
 * DATA MIGRATION SCRIPT - Fix companyId assignments
 * Run this script to update all documents without companyId
 * 
 * STEPS:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Open Firestore Database
 * 3. Check which items have companyId and which don't
 * 4. Update this script with your company IDs
 * 5. Run in browser console or Node.js environment
 */

import { db } from '../src/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  writeBatch,
  limit
} from 'firebase/firestore';

// CONFIGURE THESE IDs based on your database
const COMPANY_IDS = {
  MADIHAA: 'madihaa-company-id', // Replace with actual ID from your companies collection
  VILLA_PARK: 'villa-park-company-id', // Replace with actual ID
};

// Map items to their correct company based on identifying info
// This is a manual mapping - you'll need to identify which items belong where
const getCompanyIdForItem = (collection: string, data: any): string | null => {
  // Example logic - adjust based on your data:
  
  // If item has email/createdBy that contains "villa" -> Villa Park
  const email = data.email || data.createdByEmail || '';
  if (email.toLowerCase().includes('villa')) return COMPANY_IDS.VILLA_PARK;
  if (email.toLowerCase().includes('madihaa')) return COMPANY_IDS.MADIHAA;
  
  // If item name contains villa park indicators
  const name = (data.name || data.title || '').toLowerCase();
  if (name.includes('villa') || name.includes('vp')) return COMPANY_IDS.VILLA_PARK;
  
  // Check location/department
  const dept = (data.department || data.location || '').toLowerCase();
  if (dept.includes('villa')) return COMPANY_IDS.VILLA_PARK;
  if (dept.includes('madihaa')) return COMPANY_IDS.MADIHAA;
  
  // Default to Madihaa if can't determine (or return null to skip)
  return null;
};

// Main migration function
export async function fixMissingCompanyIds() {
  const collections = ['work_orders', 'assets', 'projects', 'inventory', 'fuel_requests', 'cold_rooms', 'users'];
  const batchSize = 500; // Firestore batch limit
  
  for (const colName of collections) {
    console.log(`\n=== Processing ${colName} ===`);
    
    // Get all documents without companyId
    const colRef = collection(db, colName);
    // Note: We can't query for missing field easily, so get all and filter
    const snapshot = await getDocs(colRef);
    
    const toUpdate: Array<{ ref: any; companyId: string }> = [];
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.companyId) {
        const companyId = getCompanyIdForItem(colName, data);
        if (companyId) {
          toUpdate.push({ ref: docSnap.ref, companyId });
        }
      }
    });
    
    console.log(`Found ${toUpdate.length} documents without companyId in ${colName}`);
    
    // Update in batches
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = toUpdate.slice(i, i + batchSize);
      
      chunk.forEach(({ ref, companyId }) => {
        batch.update(ref, { companyId, updatedAt: new Date().toISOString() });
      });
      
      await batch.commit();
      console.log(`Updated batch ${i / batchSize + 1} (${chunk.length} items)`);
    }
    
    console.log(`✅ Completed ${colName}: ${toUpdate.length} items updated`);
  }
  
  console.log('\n🎉 Migration complete!');
}

// Alternative: Quick fix for specific company
export async function assignAllToCompany(companyId: string, collections?: string[]) {
  const cols = collections || ['work_orders', 'assets', 'projects', 'inventory'];
  
  for (const colName of cols) {
    console.log(`\n=== Assigning all ${colName} to company ${companyId} ===`);
    
    const snapshot = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.companyId) {
        batch.update(docSnap.ref, { companyId, updatedAt: new Date().toISOString() });
        count++;
      }
    });
    
    await batch.commit();
    console.log(`✅ Updated ${count} items in ${colName}`);
  }
}

// Run with:
// fixMissingCompanyIds() - Smart assignment based on data
// assignAllToCompany('your-company-id') - Assign all unassigned to one company
