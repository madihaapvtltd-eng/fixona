import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft } from 'lucide-react';

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: item } = useQuery(['inventory', id], async () => {
    if (!id) return null;
    const docRef = doc(db, 'inventory', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });

  if (!item) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/inventory" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500">{item.partNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{item.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quantity in Stock</p>
            <p className="font-medium text-lg">{item.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Minimum Threshold</p>
            <p className="font-medium">{item.minThreshold}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unit Cost</p>
            <p className="font-medium">${item.unitCost?.toFixed(2)}</p>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <p className="text-sm text-gray-500">Supplier</p>
            <p className="font-medium">{item.supplierName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Storage Location</p>
            <p className="font-medium">{item.storageLocation || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lead Time</p>
            <p className="font-medium">{item.leadTime ? `${item.leadTime} days` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium">{item.description || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
