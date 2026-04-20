// Diagnostic script to check companyId assignments in Firestore
// Run this in browser console while logged in as admin

const diagnoseCompanyData = async () => {
  const { db } = await import('@/lib/firebase');
  const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
  const { useAuthStore } = await import('@/stores/authStore');
  
  const user = useAuthStore.getState().user;
  console.log('Current user:', user?.email, 'companyId:', user?.companyId);
  
  const collections = ['work_orders', 'assets', 'projects', 'inventory', 'fuel_requests', 'cold_rooms'];
  
  for (const colName of collections) {
    console.log(`\n=== Checking ${colName} ===`);
    const snapshot = await getDocs(collection(db, colName));
    
    const companyIdCounts = {};
    const noCompanyId = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const companyId = data.companyId;
      
      if (!companyId) {
        noCompanyId.push({ id: doc.id, name: data.name || data.title || 'N/A' });
      } else {
        companyIdCounts[companyId] = (companyIdCounts[companyId] || 0) + 1;
      }
    });
    
    console.log(`Total documents: ${snapshot.size}`);
    console.log(`Documents WITHOUT companyId: ${noCompanyId.length}`);
    if (noCompanyId.length > 0) {
      console.log('Sample items without companyId:', noCompanyId.slice(0, 3));
    }
    
    console.log('CompanyId distribution:', companyIdCounts);
  }
};

// Export for use
diagnoseCompanyData();
