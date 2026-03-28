import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function BootstrapAdminPage() {
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    checkForAdmin();
  }, []);

  const checkForAdmin = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'super_admin'));
      const snap = await getDocs(q);
      setHasAdmin(!snap.empty);
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const promoteToAdmin = async () => {
    if (!user?.id) return;
    setPromoting(true);
    try {
      await setDoc(doc(db, 'users', user.id), {
        role: 'super_admin',
        name: user.name || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      toast.success('You are now Super Admin! Please log out and log back in.');
      setHasAdmin(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to promote. Try again.');
    } finally {
      setPromoting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Admin Already Exists</h2>
          <p className="text-gray-600 mt-2">
            A Super Admin is already configured. Contact them to get admin access.
          </p>
          <Link to="/" className="btn btn-primary mt-4 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Setup Super Admin</h2>
          <p className="text-gray-600 mt-2">
            No admin exists yet. You can promote yourself to Super Admin.
          </p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Current User</p>
              <p className="text-sm text-amber-800">{user?.email}</p>
              <p className="text-sm text-amber-700 mt-1">
                You will have full access to all features.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={promoteToAdmin}
          disabled={promoting}
          className="w-full btn btn-primary mt-6"
        >
          {promoting ? 'Promoting...' : 'Become Super Admin'}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          This is a one-time setup. After this, only Super Admins can add other admins.
        </p>
      </div>
    </div>
  );
}
