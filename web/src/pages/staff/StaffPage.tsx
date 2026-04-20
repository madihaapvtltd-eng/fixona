import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Search, User as UserIcon, Star, Wrench, Plus } from 'lucide-react';

export function StaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, getCompanyId, isSuperAdmin } = useAuthStore();
  const companyId = getCompanyId();

  const { data: users, isLoading } = useQuery(['users', companyId], async () => {
    let q;
    if (isSuperAdmin() && !companyId) {
      q = query(collection(db, 'users'), where('isActive', '==', true));
    } else if (companyId) {
      q = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      );
    } else {
      return [];
    }
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
  }, {
    enabled: !!user && (!!companyId || isSuperAdmin()),
  });

  const filteredUsers = users?.filter((user: DocumentData) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Construction worker-cuate.svg" 
            alt="Staff" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-sm text-gray-500">Manage team members and their roles</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link to="/staff/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add User
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">Loading...</div>
        ) : filteredUsers?.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <img 
              src="/storyset-illustrations/Work life balance-rafiki.svg" 
              alt="No staff" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-500">No staff members found</p>
          </div>
        ) : (
          filteredUsers?.map((user: DocumentData) => (
            <Link
              key={user.id}
              to={`/staff/${user.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <span className="flex items-center text-sm text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  {user.rating || 'N/A'}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <span className="text-gray-500">{user.email}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Wrench className="h-4 w-4" />
                  {user.tasksCompleted || 0} tasks
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
