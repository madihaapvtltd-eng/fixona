import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePermissions } from '@/hooks/usePermissions';  
import { useAuthStore } from '@/stores/authStore';
import { Plus, Search, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function WorkOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const { user } = useAuthStore();
  const { 
    canViewAllWorkOrders, 
    canViewDepartmentWorkOrders, 
    canViewOnlyAssigned,
    userRole,
    userDepartment 
  } = usePermissions();

  const { data: workOrders, isLoading, error, refetch } = useQuery('workOrders', async () => {
    try {
      let q;
      
      if (canViewAllWorkOrders || userRole === 'super_admin' || userRole === 'dept_admin') {
        if (canViewAllWorkOrders) {
          q = query(collection(db, 'work_orders'), orderBy('createdAt', 'desc'));
        } else {
          q = query(
            collection(db, 'work_orders'), 
            where('department', '==', userDepartment),
            orderBy('createdAt', 'desc')
          );
        }
      } else {
        // For technicians - get all work orders without department filter
        // and filter client-side by assigned user
        q = query(
          collection(db, 'work_orders'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snap = await getDocs(q);
      console.log('WorkOrders: Loaded', snap.docs.length, 'work orders');
      const allWorkOrders = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
      
      // For non-admin users, filter to only show assigned work orders or ones they created
      if (!canViewAllWorkOrders && userRole !== 'super_admin' && userRole !== 'dept_admin') {
        return allWorkOrders.filter((wo: any) => 
          wo.technicianId === user?.id || 
          wo.supervisorId === user?.id ||
          wo.createdBy === user?.id
        );
      }
      
      return allWorkOrders;
    } catch (err: any) {
      console.error('Error loading work orders:', err);
      if (err.message?.includes('index')) {
        toast.error('Database index required. Please check Firebase console.');
      } else {
        toast.error('Failed to load work orders: ' + err.message);
      }
      throw err;
    }
  }, {
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  const filteredWO = workOrders?.filter((wo: DocumentData) => {
    const matchesSearch = wo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.woNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || wo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || wo.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Task-amico.svg" 
            alt="Work Orders" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-sm text-gray-500">
              {userRole === 'technician' ? 'Your assigned tasks' : 'Manage and track all maintenance work orders'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        <Link to="/work-orders/create" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Create Work Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="raised">Raised</option>
          <option value="assigned_to_supervisor">Assigned to Supervisor</option>
          <option value="assigned_to_technician">Assigned to Technician</option>
          <option value="in_progress">In Progress</option>
          <option value="need_to_buy">Need to Buy</option>
          <option value="fixed">Fixed</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="card p-8 text-center">Loading work orders...</div>
        ) : error ? (
          <div className="card p-8 text-center text-red-600">
            <p>Error loading work orders.</p>
            <p className="text-sm text-gray-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : workOrders?.length === 0 ? (
          <div className="card p-8 text-center">
            <img 
              src="/storyset-illustrations/Under construction-amico.svg" 
              alt="No work orders" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-500">
              {userRole === 'technician' 
                ? 'No work orders assigned to you' 
                : 'No work orders found'}
            </p>
            <p className="text-sm text-gray-400 mt-2">Create a new work order to get started</p>
            <p className="text-xs text-gray-400 mt-1">Role: {userRole}, User ID: {user?.id?.slice(0,8)}...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">Showing {filteredWO?.length} of {workOrders?.length} work orders</p>
            {filteredWO?.map((wo: DocumentData) => (
            <Link
              key={wo.id}
              to={`/work-orders/${wo.id}`}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-primary-600">{wo.woNumber}</span>
                  <span className={`badge status-${wo.status}`}>{wo.status.replace('_', ' ')}</span>
                  <span className={`badge priority-${wo.priority}`}>{wo.priority}</span>
                </div>
                <h3 className="font-medium text-gray-900">{wo.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{wo.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Due: {wo.dueDate ? format(wo.dueDate.toDate(), 'MMM d, yyyy') : 'Not set'}</span>
                  <span>Cost: MVR {wo.cost?.toFixed(2) || '0.00'}</span>
                  {wo.technicianName && <span>Assigned: {wo.technicianName}</span>}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
          </>
        )}
      </div>
    </div>
  );
}
