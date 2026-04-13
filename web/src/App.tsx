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
import { EditProjectPage } from '@/pages/projects/EditProjectPage';
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
import { FuelRequestsListPage } from '@/pages/fuel/FuelRequestsListPage';
import { FuelRequestPage } from '@/pages/fuel/FuelRequestPage';
import { SuperAdminLogin } from '@/pages/admin/SuperAdminLogin';
import { CompaniesPage } from '@/pages/admin/CompaniesPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { DataMigrationPage } from '@/pages/admin/DataMigrationPage';
import { GeneratorsPage } from '@/pages/generators/GeneratorsPage';
import { GeneratorDetailPage } from '@/pages/generators/GeneratorDetailPage';
import { NewGeneratorPage } from '@/pages/generators/NewGeneratorPage';
import { GeneratorMaintenancePage } from '@/pages/generators/GeneratorMaintenancePage';
import { ColdRoomsPage } from '@/pages/coldrooms/ColdRoomsPage';
import { ColdRoomDetailPage } from '@/pages/coldrooms/ColdRoomDetailPage';
import { NewColdRoomPage } from '@/pages/coldrooms/NewColdRoomPage';
import { TemperatureLogPage } from '@/pages/coldrooms/TemperatureLogPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient();

function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Auth] Initializing auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] onAuthStateChanged fired:', firebaseUser ? 'User found' : 'No user');
      
      if (firebaseUser) {
        try {
          console.log('[Auth] Fetching user data from Firestore...');
          const { getDoc, doc, db } = await import('@/lib/firebase');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          console.log('[Auth] User data fetched:', userData);
          
          const userName = userData?.name || firebaseUser.displayName || '';
          const cleanName = userName && (userName.toLowerCase() === userData?.department?.toLowerCase() || 
                                         userName.toLowerCase() === userData?.role?.toLowerCase()) 
                            ? firebaseUser.displayName || userData?.email?.split('@')[0] || '' 
                            : userName;
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: userData?.role || 'staff',
            isActive: userData?.isActive ?? true,
            ...userData,
            name: cleanName,
          });
        } catch (error) {
          console.error('[Auth] Error loading user data:', error);
        }
      } else {
        console.log('[Auth] Setting user to null');
        setUser(null);
      }
      
      console.log('[Auth] Setting loading to false');
      setLoading(false);
    });

    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Timeout reached, forcing loading to false');
      setLoading(false);
    }, 3000);

    return () => {
      console.log('[Auth] Cleaning up auth listener');
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [setUser, setLoading]);

  console.log('[App] Rendering, loading:', loading, 'user:', user ? 'yes' : 'no');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-500">Loading...</p>
        <button
          onClick={() => {
            // Emergency reset
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stuck? Click to Reset
        </button>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/superadmin" element={<SuperAdminLogin />} />
      </Route>

      {/* Super Admin Routes */}
      <Route element={user?.role === 'super_admin' ? <DashboardLayout /> : <Navigate to="/superadmin" />}>
        <Route path="/admin/companies" element={<CompaniesPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/migrate" element={<DataMigrationPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/create" element={<CreateProjectPage />} />
        <Route path="/projects/:id/edit" element={<EditProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/new" element={<NewAssetPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/fuel-requests" element={<FuelRequestsListPage />} />
        <Route path="/fuel-requests/:id" element={<FuelRequestPage />} />
        <Route path="/generators" element={<GeneratorsPage />} />
        <Route path="/generators/new" element={<NewGeneratorPage />} />
        <Route path="/generators/:id" element={<GeneratorDetailPage />} />
        <Route path="/generators/:id/maintenance" element={<GeneratorMaintenancePage />} />
        <Route path="/cold-rooms" element={<ColdRoomsPage />} />
        <Route path="/cold-rooms/new" element={<NewColdRoomPage />} />
        <Route path="/cold-rooms/:id" element={<ColdRoomDetailPage />} />
        <Route path="/cold-rooms/temperature-log" element={<TemperatureLogPage />} />
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
