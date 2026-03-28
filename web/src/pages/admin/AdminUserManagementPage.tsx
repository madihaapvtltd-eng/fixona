import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserCard, StatCard, ActionButton } from '@/components/ui/ColorfulCards';
import { 
  Users, Shield, Eye, Edit3, Trash2, Settings, 
  CheckCircle, XCircle, Plus, Search, Filter 
} from 'lucide-react';
import { 
  ROLE_PERMISSIONS, 
  PERMISSIONS, 
  getRolePermissions,
  hasPermission 
} from '@/lib/permissions';
import toast from 'react-hot-toast';

export function AdminUserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    permissions: [] as string[],
  });
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const userData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setUsers(userData);
    setLoading(false);
  };

  const updateUserPermissions = async (userId: string, permissions: string[]) => {
    await updateDoc(doc(db, 'users', userId), { permissions });
    toast.success('Permissions updated');
    loadUsers();
    setShowPermissionModal(false);
  };

  const updateUserRole = async (userId: string, role: string) => {
    const defaultPermissions = getRolePermissions(role);
    await updateDoc(doc(db, 'users', userId), { 
      role, 
      permissions: defaultPermissions 
    });
    toast.success(`Role updated to ${role}`);
    loadUsers();
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const defaultPermissions = getRolePermissions(newUser.role);
    await addDoc(collection(db, 'users'), {
      ...newUser,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString(),
    });
    
    toast.success('User created successfully');
    setShowNewUserForm(false);
    setNewUser({ name: '', email: '', role: 'user', department: '', permissions: [] });
    loadUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteDoc(doc(db, 'users', userId));
    toast.success('User deleted');
    loadUsers();
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || user.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'super_admin' || u.role === 'dept_admin').length,
    supervisors: users.filter(u => u.role === 'supervisor').length,
    staff: users.filter(u => ['technician', 'designer', 'marketing'].includes(u.role)).length,
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin User Management</h1>
            <p className="text-gray-500">Manage users, roles, and permissions</p>
          </div>
        </div>
        <ActionButton 
          onClick={() => setShowNewUserForm(true)}
          gradient="from-green-500 to-emerald-500"
          icon={<Plus className="h-5 w-5" />}
        >
          Add New User
        </ActionButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.total} 
          icon={<Users className="h-5 w-5" />}
          gradient="from-blue-400 to-indigo-500"
        />
        <StatCard 
          title="Admins" 
          value={stats.admins} 
          icon={<Shield className="h-5 w-5" />}
          gradient="from-red-400 to-pink-500"
        />
        <StatCard 
          title="Supervisors" 
          value={stats.supervisors} 
          icon={<Users className="h-5 w-5" />}
          gradient="from-blue-400 to-cyan-500"
        />
        <StatCard 
          title="Staff" 
          value={stats.staff} 
          icon={<Users className="h-5 w-5" />}
          gradient="from-green-400 to-emerald-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-lg"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="dept_admin">Dept Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="technician">Technician</option>
          <option value="designer">Designer</option>
          <option value="marketing">Marketing</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="relative group">
            <UserCard user={user} />
            
            {/* Quick Actions Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => { setSelectedUser(user); setShowPermissionModal(true); }}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                Permissions
              </button>
              <select
                value={user.role}
                onChange={(e) => updateUserRole(user.id, e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="user">User</option>
                <option value="technician">Technician</option>
                <option value="designer">Designer</option>
                <option value="marketing">Marketing</option>
                <option value="supervisor">Supervisor</option>
                <option value="dept_admin">Dept Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                onClick={() => deleteUser(user.id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New User Modal */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input w-full"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input w-full"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User (Level 3)</option>
                  <option value="technician">Technician (Level 3)</option>
                  <option value="designer">Designer (Level 3)</option>
                  <option value="marketing">Marketing (Level 3)</option>
                  <option value="supervisor">Supervisor (Level 3)</option>
                  <option value="dept_admin">Department Admin (Level 2)</option>
                  <option value="super_admin">Super Admin (Level 1)</option>
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select
                  className="input w-full"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  <option value="it">IT</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="marketing">Marketing</option>
                  <option value="accounts">Accounts</option>
                  <option value="hr">HR</option>
                  <option value="purchasing">Purchasing</option>
                  <option value="operation">Operation</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewUserForm(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Permissions for {selectedUser.name || selectedUser.email}
            </h2>
            
            <div className="space-y-4">
              {/* Current Role */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-2">Current Role</p>
                <p className="font-semibold capitalize">{selectedUser.role?.replace(/_/g, ' ')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Default permissions for this role are pre-selected
                </p>
              </div>

              {/* Permission Groups */}
              <div className="space-y-4">
                {/* View Permissions */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    View Permissions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { key: PERMISSIONS.VIEW_ALL_DEPARTMENTS, label: 'View all departments' },
                      { key: PERMISSIONS.VIEW_OWN_DEPARTMENT, label: 'View own department only' },
                      { key: PERMISSIONS.VIEW_ASSIGNED_ONLY, label: 'View assigned work only' },
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUser.permissions?.includes(perm.key)}
                          onChange={(e) => {
                            const perms = e.target.checked
                              ? [...(selectedUser.permissions || []), perm.key]
                              : (selectedUser.permissions || []).filter((p: string) => p !== perm.key);
                            setSelectedUser({ ...selectedUser, permissions: perms });
                          }}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Edit Permissions */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-green-500" />
                    Edit Permissions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { key: PERMISSIONS.EDIT_ALL_WORK_ORDERS, label: 'Edit all work orders' },
                      { key: PERMISSIONS.EDIT_OWN_DEPARTMENT, label: 'Edit own department only' },
                      { key: PERMISSIONS.EDIT_ASSIGNED_ONLY, label: 'Edit assigned work only' },
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUser.permissions?.includes(perm.key)}
                          onChange={(e) => {
                            const perms = e.target.checked
                              ? [...(selectedUser.permissions || []), perm.key]
                              : (selectedUser.permissions || []).filter((p: string) => p !== perm.key);
                            setSelectedUser({ ...selectedUser, permissions: perms });
                          }}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delete Permissions */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Delete Permissions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { key: PERMISSIONS.DELETE_ALL, label: 'Can delete anything' },
                      { key: PERMISSIONS.DELETE_OWN_DEPARTMENT, label: 'Can delete own department items' },
                      { key: PERMISSIONS.NO_DELETE, label: 'Cannot delete' },
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUser.permissions?.includes(perm.key)}
                          onChange={(e) => {
                            const perms = e.target.checked
                              ? [...(selectedUser.permissions || []), perm.key]
                              : (selectedUser.permissions || []).filter((p: string) => p !== perm.key);
                            setSelectedUser({ ...selectedUser, permissions: perms });
                          }}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserPermissions(selectedUser.id, selectedUser.permissions || [])}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
