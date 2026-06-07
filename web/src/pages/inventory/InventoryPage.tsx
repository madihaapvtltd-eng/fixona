import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Search } from 'lucide-react';

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, getCompanyId, isSuperAdmin } = useAuthStore();
  const companyId = getCompanyId();

  const { data: items, isLoading } = useQuery(['inventory', companyId], async () => {
    let q;
    if (isSuperAdmin() && !companyId) {
      q = query(collection(db, 'inventory'), orderBy('name'));
    } else if (companyId) {
      q = query(
        collection(db, 'inventory'),
        where('companyId', '==', companyId),
        orderBy('name')
      );
    } else {
      return [];
    }
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
  }, {
    enabled: !!user && (!!companyId || isSuperAdmin()),
  });

  const filteredItems = items?.filter((item: DocumentData) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.partNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Product teardown-amico.svg" 
            alt="Inventory" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500">Manage spare parts and stock levels</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Link to="/inventory/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : filteredItems?.length === 0 ? (
          <div className="p-8 text-center">
            <img 
              src="/storyset-illustrations/Construction-rafiki.svg" 
              alt="No inventory" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-500">No inventory items found</p>
            <p className="text-sm text-gray-400 mt-2">Add your first item to get started</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems?.map((item: DocumentData) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">
                    <Link to={`/inventory/${item.id}`}>{item.partNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.minThreshold}</td>
                  <td className="px-4 py-3">
                    {item.quantity <= item.minThreshold ? (
                      <span className="badge bg-red-100 text-red-800">Low Stock</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-800">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
