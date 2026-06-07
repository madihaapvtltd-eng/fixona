import { useState } from 'react';
import { recalculateAllWorkOrderCosts, recalculateWorkOrderCost } from '@/lib/recalculateCosts';
import { useAuthStore } from '@/stores/authStore';
import { Calculator, RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function AdminToolsPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    errors: string[];
    details: Array<{ id: string; woNumber: string; oldCost: number; newCost: number }>;
  } | null>(null);
  const [singleWoId, setSingleWoId] = useState('');
  const [singleResult, setSingleResult] = useState<any>(null);

  // Only super admin can access this page
  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only Super Admin can access this page.</p>
          <Link to="/" className="btn btn-primary mt-6 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleRecalculateAll = async () => {
    if (!confirm('This will recalculate costs for ALL completed work orders. Continue?')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const recalcResult = await recalculateAllWorkOrderCosts();
      setResult(recalcResult);
      
      if (recalcResult.errors.length === 0) {
        toast.success(`Successfully updated ${recalcResult.updated} work orders`);
      } else {
        toast.error(`Updated ${recalcResult.updated} work orders with ${recalcResult.errors.length} errors`);
      }
    } catch (error: any) {
      toast.error('Failed to recalculate costs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateSingle = async () => {
    if (!singleWoId.trim()) {
      toast.error('Please enter a work order ID');
      return;
    }
    
    setLoading(true);
    setSingleResult(null);
    
    try {
      const result = await recalculateWorkOrderCost(singleWoId.trim());
      setSingleResult(result);
      
      if (result.success) {
        toast.success(`Updated work order cost: ${result.oldCost} → ${result.newCost}`);
      } else {
        toast.error(result.error || 'Failed to update work order');
      }
    } catch (error: any) {
      toast.error('Failed to recalculate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
      </div>

      {/* Recalculate All Work Orders */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <RefreshCw className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recalculate All Costs</h2>
            <p className="text-sm text-gray-500">Update costs for all completed work orders</p>
          </div>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Recalculate All Work Orders
            </>
          )}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Results</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Updated: <span className="font-semibold text-green-600">{result.updated}</span> work orders
            </p>
            {result.errors.length > 0 && (
              <p className="text-sm text-red-600 mb-2">
                Errors: {result.errors.length}
              </p>
            )}
            
            {result.details.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Updated Work Orders:</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {result.details.map((detail) => (
                    <div key={detail.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{detail.woNumber}</span>
                      <div className="text-sm">
                        <span className="text-gray-500">{detail.oldCost.toFixed(2)}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-semibold text-green-600">{detail.newCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recalculate Single Work Order */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calculator className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recalculate Single Work Order</h2>
            <p className="text-sm text-gray-500">Update cost for a specific work order by ID</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Work Order ID"
            value={singleWoId}
            onChange={(e) => setSingleWoId(e.target.value)}
            className="input flex-1"
          />
          <button
            onClick={handleRecalculateSingle}
            disabled={loading || !singleWoId.trim()}
            className="btn btn-secondary"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Recalculate'}
          </button>
        </div>

        {singleResult && (
          <div className={`mt-4 p-4 rounded-lg ${singleResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {singleResult.success ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-900">Successfully Updated</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Previous Cost:</span>
                    <p className="font-semibold">{singleResult.oldCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">New Cost:</span>
                    <p className="font-semibold text-green-600">{singleResult.newCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Parts Cost:</span>
                    <p className="font-semibold">{singleResult.breakdown.partsCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Purchase Cost:</span>
                    <p className="font-semibold">{singleResult.breakdown.purchaseCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Labor Cost:</span>
                    <p className="font-semibold">{singleResult.breakdown.laborCost.toFixed(2)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{singleResult.error || 'Failed to update'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
