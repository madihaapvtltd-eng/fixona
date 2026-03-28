import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import { ArrowLeft, Mail, Phone, Star, Wrench, Clock, Save, Trash2, Key, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const { data: user, refetch } = useQuery(['user', id], async () => {
    if (!id) return null;
    const docRef = doc(db, 'users', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });

  const handleRoleUpdate = async () => {
    if (!id || !newRole) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
      toast.success('Role updated successfully! Please log out and log back in to see changes.');
      setEditingRole(false);
      refetch();
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!id) return;
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete users');
      return;
    }
    if (id === currentUser?.id) {
      toast.error('You cannot delete yourself');
      return;
    }
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User deleted successfully');
      navigate('/staff');
    } catch (error) {
      toast.error('Failed to delete user');
      setDeleting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!id || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can reset passwords');
      return;
    }
    setResettingPassword(true);
    try {
      // Import Firebase Admin SDK functions
      const { getAuth, updatePassword } = await import('firebase/auth');
      const auth = getAuth();
      
      // Note: In a real app, you would use Firebase Admin SDK on the backend
      // For now, we'll update a password field in Firestore (not secure for production)
      await updateDoc(doc(db, 'users', id), { 
        passwordResetRequired: true,
        tempPassword: newPassword 
      });
      toast.success('Password reset initiated. User will be prompted to change on next login.');
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Staff Profile</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            {editingRole ? (
              <div className="flex items-center gap-2 mt-1">
                <select
                  className="input text-sm py-1"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="dept_admin">Department Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="technician">Technician</option>
                  <option value="staff">Staff</option>
                </select>
                <button
                  onClick={handleRoleUpdate}
                  disabled={updating}
                  className="btn btn-primary py-1 px-3 text-sm"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingRole(false)}
                  className="btn btn-secondary py-1 px-3 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-500 capitalize">{user.role}</p>
                <button
                  onClick={() => { setNewRole(user.role); setEditingRole(true); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit Role
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                {user.rating || 'N/A'}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Wrench className="h-4 w-4" />
                {user.tasksCompleted || 0} tasks completed
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </p>
            <p className="font-medium">{user.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Department
            </p>
            <p className="font-medium">{user.department || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">WhatsApp Enabled</p>
            <p className="font-medium">{user.whatsappEnabled ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Admin Actions - Only visible to Super Admin */}
        {isSuperAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Admin Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPasswordReset(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={id === currentUser?.id}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </button>
            </div>
            {id === currentUser?.id && (
              <p className="text-xs text-gray-500 mt-2">You cannot delete your own account</p>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h2 className="text-xl font-bold">Delete User?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete <strong>{user.name}</strong> ({user.email}). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter a new password for <strong>{user.name}</strong>. User will be prompted to change this on next login.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="input w-full"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setNewPassword('');
                  }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword || newPassword.length < 6}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
