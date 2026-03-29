import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { QueryClient } from 'react-query';

// Layouts
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AssetsPage } from '@/pages/assets/AssetsPage';
import { AssetDetailPage } from '@/pages/assets/AssetDetailPage';
import { NewAssetPage } from '@/pages/assets/NewAssetPage';
import { WorkOrdersPage } from '@/pages/workOrders/WorkOrdersPage';
import { WorkOrderDetailPage } from '@/pages/workOrders/WorkOrderDetailPage';
import { CreateWorkOrderPage } from '@/pages/workOrders/CreateWorkOrderPage';
import { ProjectsListPage } from '@/pages/projects/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { CreateProjectPage } from '@/pages/projects/CreateProjectPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { InventoryDetailPage } from '@/pages/inventory/InventoryDetailPage';
import { StaffPage } from '@/pages/staff/StaffPage';
import { StaffDetailPage } from '@/pages/staff/StaffDetailPage';
import { NewUserPage } from '@/pages/staff/NewUserPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AdminSettingsPage } from '@/pages/settings/AdminSettingsPage';
import { BootstrapAdminPage } from '@/pages/admin/BootstrapAdminPage';
import { AdminToolsPage } from '@/pages/admin/AdminToolsPage';
import { TechnicianMobilePage } from '@/pages/technician/TechnicianMobilePage';
import { AIDashboardPage } from '@/pages/ai/AIDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient();

function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const { getDoc, doc, db } = await import('@/lib/firebase');
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        // Set user even if Firestore doc doesn't exist yet
        // IMPORTANT: name should be person's name, not department
        const userName = userData?.name || firebaseUser.displayName || '';
        // Filter out department name if it's mistakenly stored as 'name'
        const cleanName = userName && (userName.toLowerCase() === userData?.department?.toLowerCase() || 
                                       userName.toLowerCase() === userData?.role?.toLowerCase()) 
                          ? firebaseUser.displayName || userData?.email?.split('@')[0] || '' 
                          : userName;
        
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          role: userData?.role || 'staff',
          ...userData,
          name: cleanName, // Ensure name is always the person's name, not department
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/create" element={<CreateProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/new" element={<NewAssetPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="/work-orders/create" element={<CreateWorkOrderPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryDetailPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/staff/:id" element={<StaffDetailPage />} />
        <Route path="/staff/new" element={<NewUserPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/setup-admin" element={<BootstrapAdminPage />} />
        <Route path="/admin/tools" element={<AdminToolsPage />} />
        <Route path="/technician" element={<TechnicianMobilePage />} />
        <Route path="/ai-dashboard" element={<AIDashboardPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
