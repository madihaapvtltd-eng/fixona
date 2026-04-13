import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuthStore, type User as UserType, type Company, Permission, hasPermission } from '@/stores/authStore';
import { Users, Plus, Search, Edit2, Trash2, Building2, Shield, UserCheck, UserX, Filter, Settings } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  companyId: string;
  role: UserType['role'];
  department: string;
  isActive: boolean;
  password: string;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  phone: '',
  companyId: '',
  role: 'staff',
  department: '',
  isActive: true,
  password: '',
};

const roleOptions: { value: UserType['role']; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access - all companies' },
  { value: 'company_admin', label: 'Company Admin', description: 'Full access within their company' },
  { value: 'supervisor', label: 'Supervisor', description: 'Can manage work orders and view reports' },
  { value: 'technician', label: 'Technician', description: 'Can update work orders and view assets' },
  { value: 'staff', label: 'Staff', description: 'Read-only access to basic information' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access for reports' },
];

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  
  const { user, isSuperAdmin, companies, setCompanies } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch companies whenever modal opens or on mount
  useEffect(() => {
    if (isSuperAdmin()) {
      const fetchCompanies = async () => {
        const snap = await getDocs(collection(db, 'companies'));
        const comps = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Company[];
        setCompanies(comps);
      };
      fetchCompanies();
    }
  }, [isSuperAdmin, setCompanies, isModalOpen]);

  // Fetch users
  const { data: users, isLoading } = useQuery('users', async () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserType[];
  }, {
    enabled: user?.role === 'super_admin' || user?.role === 'company_admin',
  });

  // Create user mutation
  const createMutation = useMutation(
    async (data: UserFormData) => {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;
      
      // 2. Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: data.name });
      
      // 3. Create user document in Firestore with Firebase UID
      const company = companies.find(c => c.id === data.companyId);
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyId: data.companyId,
        companyName: company?.name || '',
        role: data.role,
        department: data.department,
        isActive: data.isActive,
        createdAt: serverTimestamp(),
      });
      
      return firebaseUser.uid;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User created successfully - they can now log in');
        closeModal();
      },
      onError: (error: any) => {
        console.error('Error creating user:', error);
        if (error.code === 'auth/email-already-in-use') {
          toast.error('Email already registered');
        } else if (error.code === 'auth/weak-password') {
          toast.error('Password is too weak');
        } else {
          toast.error('Failed to create user: ' + error.message);
        }
      },
    }
  );

  // Update user mutation
  const updateMutation = useMutation(
    async ({ id, data, features }: { id: string; data: Partial<UserFormData>; features?: UserType['features'] }) => {
      const updateData: any = { ...data };
      if (data.companyId) {
        const company = companies.find(c => c.id === data.companyId);
        updateData.companyName = company?.name || '';
      }
      // Include features if provided
      if (features) {
        updateData.features = features;
      }
      await updateDoc(doc(db, 'users', id), updateData);
      return true;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User updated successfully');
        closeModal();
      },
      onError: () => toast.error('Failed to update user'),
    }
  );

  // Toggle user active status
  const toggleActiveMutation = useMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await updateDoc(doc(db, 'users', id), { isActive });
      return true;
    },
    {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries('users');
        toast.success(vars.isActive ? 'User activated' : 'User deactivated');
      },
      onError: () => toast.error('Failed to update user status'),
    }
  );

  // Delete user mutation
  const deleteMutation = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, 'users', id));
      return true;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
      },
      onError: () => toast.error('Failed to delete user'),
    }
  );

  // Filter users
  const filteredUsers = users?.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = filterCompany === 'all' || u.companyId === filterCompany;
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesCompany && matchesRole;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (userData: UserType) => {
    setEditingUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      companyId: userData.companyId || '',
      role: userData.role,
      department: userData.department || '',
      isActive: userData.isActive,
      password: '', // Don't show password
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700';
      case 'company_admin': return 'bg-blue-100 text-blue-700';
      case 'supervisor': return 'bg-green-100 text-green-700';
      case 'technician': return 'bg-yellow-100 text-yellow-700';
      case 'staff': return 'bg-gray-100 text-gray-700';
      case 'viewer': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const canAccessUsers = user?.role === 'super_admin' || user?.role === 'company_admin';

if (!canAccessUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage users and their access levels</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/companies"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Building2 size={18} />
            Companies
          </Link>
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          {isSuperAdmin() && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="input pl-10 appearance-none"
              >
                <option value="all">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input pl-10 appearance-none"
            >
              <option value="all">All Roles</option>
              {roleOptions.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers?.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No users found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || filterCompany !== 'all' || filterRole !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first user to get started'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers?.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {userData.companyName || (
                        userData.role === 'super_admin' ? (
                          <span className="text-purple-600">All Companies</span>
                        ) : (
                          <span className="text-red-500">Not Assigned</span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getRoleBadgeColor(userData.role)}`}>
                      {roleOptions.find(r => r.value === userData.role)?.label || userData.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ 
                        id: userData.id, 
                        isActive: !userData.isActive 
                      })}
                      className={`flex items-center gap-1 text-sm ${
                        userData.isActive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {userData.isActive ? (
                        <><UserCheck size={16} /> Active</>
                      ) : (
                        <><UserX size={16} /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {userData.lastLoginAt 
                      ? format(userData.lastLoginAt.toDate(), 'MMM d, yyyy HH:mm')
                      : 'Never'
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(userData)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${userData.name}"?`)) {
                            deleteMutation.mutate(userData.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="john@company.com"
                required
                disabled={!!editingUser}
              />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Minimum 8 characters"
                required={!editingUser}
                minLength={8}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="Contact number"
              />
            </div>
            <div>
              <label className="label">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
                placeholder="e.g., Maintenance"
              />
            </div>
          </div>

          <div>
            <label className="label">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
              className="input"
              required
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {(formData.role as string) !== 'super_admin' && (
            <div>
              <label className="label">Company *</label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="input"
                required={formData.role !== 'super_admin'}
              >
                <option value="">Select a company</option>
                {companies.filter(c => c.isActive).map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.code})
                  </option>
                ))}
              </select>
              {companies.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No active companies available. Create a company first.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active User
            </label>
          </div>

          {/* Feature Toggles */}
          {editingUser && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings size={18} />
                Feature Access (Toggle ON/OFF)
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Control which features this user can access. All features are enabled by default.
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[
                  { key: 'assets', label: 'Assets Management' },
                  { key: 'generators', label: 'Power Generators' },
                  { key: 'coldRooms', label: 'Cold Rooms & Refrigeration' },
                  { key: 'workOrders', label: 'Work Orders' },
                  { key: 'fuelRequests', label: 'Fuel Requests' },
                  { key: 'inventory', label: 'Inventory' },
                  { key: 'staff', label: 'Staff Management' },
                  { key: 'reports', label: 'Reports' },
                  { key: 'technician', label: 'Technician Mobile' },
                  { key: 'projects', label: 'Projects' },
                  { key: 'housekeeping', label: 'Housekeeping' },
                  { key: 'poolSpa', label: 'Pool & Spa' },
                  { key: 'waterManagement', label: 'Water & Energy' },
                  { key: 'staffScheduling', label: 'Staff Scheduling' },
                  { key: 'waterSports', label: 'Water Sports' },
                  { key: 'foodBeverage', label: 'Food & Beverage' },
                  { key: 'fleet', label: 'Fleet Management' },
                  { key: 'security', label: 'Security & Safety' },
                  { key: 'guestExperience', label: 'Guest Experience' },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{feature.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingUser.features?.[feature.key as keyof UserType['features']] !== false}
                        onChange={(e) => {
                          const newFeatures = { 
                            ...editingUser.features, 
                            [feature.key]: e.target.checked 
                          };
                          setEditingUser({ ...editingUser, features: newFeatures });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex-1"
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                editingUser ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

